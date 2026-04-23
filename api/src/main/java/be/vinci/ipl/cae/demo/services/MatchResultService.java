package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling business logic for match results.
 */
@Service
public class MatchResultService {

  private final MatchResultRepository matchResultRepository;
  private final MatchRepository matchRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  public MatchResultService(
      MatchResultRepository matchResultRepository,
      MatchRepository matchRepository,
      UserRepository userRepository,
      NotificationService notificationService) {
    this.matchResultRepository = matchResultRepository;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
  }

  /**
   * Encodes the result of a match (by an admin).
   * If a result already exists (e.g., disputed match), updates it instead of creating a new one.
   */
  @Transactional
  public MatchResult encodeResult(Long matchId, MatchResultCreateDto dto) {
    Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new IllegalArgumentException("Match introuvable."));

    User admin = userRepository.findById(dto.getAdminEncoderId())
            .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable."));

    // On cherche s'il y a DEJA un résultat pour ce match
    MatchResult result = matchResultRepository.findById(matchId).orElse(null);

    if (result == null) {
      // C'est un nouveau résultat, on le crée
      result = new MatchResult();
      result.setMatch(match);
      result.setId(match.getId());
    }

    // On met à jour les scores et les données
    result.setScoreTeam1(dto.getScoreTeam1());
    result.setScoreTeam2(dto.getScoreTeam2());
    result.setForfeitTeam1(dto.isForfeitTeam1());
    result.setForfeitTeam2(dto.isForfeitTeam2());
    result.setAdminEncoder(admin);
    result.setEncodingDate(LocalDateTime.now());

    // Statut en attente (ou validé si forfait)
    if (dto.isForfeitTeam1() || dto.isForfeitTeam2()) {
      result.setValidationStatusTeam1("VALIDATED");
      result.setValidationStatusTeam2("VALIDATED");
      match.setStatus("COMPLETED");
    } else {
      result.setValidationStatusTeam1("PENDING");
      result.setValidationStatusTeam2("PENDING");
      match.setStatus("WAITING_VALIDATION");
    }

    // On sauvegarde le match
    matchRepository.save(match);
    MatchResult savedResult = matchResultRepository.save(result);

    // ✨ C'est ici qu'on crée LA notification parfaite pour le site web !
    if (!dto.isForfeitTeam1() && !dto.isForfeitTeam2()) {
      String messageNotif = "Le score du match #" + match.getId() + " a été encodé. Allez le valider !";
      envoyerNotifAuxCapitaines(match.getTeam1(), messageNotif);
      envoyerNotifAuxCapitaines(match.getTeam2(), messageNotif);
    }

    return savedResult;
  }

  /**
   * Fonction magique pour envoyer la notification aux capitaines d'une équipe.
   */
  private void envoyerNotifAuxCapitaines(Team team, String message) {
    if (team == null) return;

    if (team.getPrimaryResponsible() != null) {
      notificationService.createNotification(team.getPrimaryResponsible(), message);
    }

    if (team.getSecondaryResponsible() != null) {
      notificationService.createNotification(team.getSecondaryResponsible(), message);
    }
  }

  /**
   * Validates or rejects a match result by a team captain.
   */
  @Transactional
  public MatchResult validateResult(Long matchId, Long teamId, boolean accepted) {
    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null || result.isDefinitive()) {
      return null;
    }

    Match match = result.getMatch();
    Team team1 = match.getTeam1();
    Team team2 = match.getTeam2();

    boolean isTeam1 = team1 != null && team1.getId().equals(teamId);
    boolean isTeam2 = team2 != null && team2.getId().equals(teamId);

    if (!isTeam1 && !isTeam2) {
      return null;
    }

    String newStatus = accepted ? "VALIDATED" : "REJECTED";

    if (isTeam1) {
      if (!"PENDING".equals(result.getValidationStatusTeam1())) return null;
      result.setValidationStatusTeam1(newStatus);
    } else {
      if (!"PENDING".equals(result.getValidationStatusTeam2())) return null;
      result.setValidationStatusTeam2(newStatus);
    }

    if (!accepted) {
      match.setStatus("DISPUTED");
      matchRepository.save(match);
      notifyAdminDispute(match, result.getAdminEncoder(), isTeam1 ? team1 : team2);
    } else if ("VALIDATED".equals(result.getValidationStatusTeam1())
            && "VALIDATED".equals(result.getValidationStatusTeam2())) {
      match.setStatus("FINISHED");
      matchRepository.save(match);
      // 🔥 NOUVEAUTÉ : Le match est validé, on fait avancer le vainqueur
      advanceWinnerToNextRound(match, result);
    }

    return matchResultRepository.save(result);
  }

  @Transactional
  public MatchResult encodeDefinitiveResult(Long matchId, MatchResultCreateDto dto) {
    Match match = matchRepository.findById(matchId).orElse(null);
    User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

    if (match == null || admin == null || !"DISPUTED".equals(match.getStatus())) {
      return null;
    }

    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null) return null;

    result.setAdminEncoder(admin);
    result.setScoreTeam1(dto.getScoreTeam1());
    result.setScoreTeam2(dto.getScoreTeam2());
    result.setForfeitTeam1(dto.isForfeitTeam1());
    result.setForfeitTeam2(dto.isForfeitTeam2());
    result.setEncodingDate(LocalDateTime.now());
    result.setValidationStatusTeam1("VALIDATED");
    result.setValidationStatusTeam2("VALIDATED");
    result.setDefinitive(true);

    match.setStatus("FINISHED");
    matchRepository.save(match);
    MatchResult saved = matchResultRepository.save(result);

    notifyTeamResponsiblesDefinitive(match, dto.getScoreTeam1(), dto.getScoreTeam2());
    
    // 🔥 NOUVEAUTÉ : Le résultat est définitif, on fait avancer le vainqueur
    advanceWinnerToNextRound(match, saved);

    return saved;
  }

  /**
   * Finds a result for a specific match.
   */
  public MatchResult getResultForMatch(Long matchId) {
    return matchResultRepository.findById(matchId).orElse(null);
  }

  @Scheduled(fixedRate = 300000)
  @Transactional
  public void autoValidateResults() {
    LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
    List<MatchResult> pendingResults = matchResultRepository.findPendingResultsOlderThan(twoHoursAgo);

    for (MatchResult res : pendingResults) {
      if (res.isDefinitive()) continue;
      
      res.setValidationStatusTeam1("VALIDATED");
      res.setValidationStatusTeam2("VALIDATED");
      res.getMatch().setStatus("FINISHED");
      
      matchRepository.save(res.getMatch());
      matchResultRepository.save(res);
      
      // 🔥 NOUVEAUTÉ : Auto-validation, on fait avancer le vainqueur
      advanceWinnerToNextRound(res.getMatch(), res);

      System.out.println("🤖 ROBOT : Le match #" + res.getMatch().getId()
              + " a été validé automatiquement après 2 heures !");
    }
  }

  // --- NOUVELLE MÉTHODE PRIVÉE POUR FAIRE AVANCER LES GAGNANTS ---
  private void advanceWinnerToNextRound(Match match, MatchResult result) {
    if (match == null || result == null || match.getTournament() == null) return;

    Team winner = null;
    if (result.getScoreTeam1() > result.getScoreTeam2()) {
      winner = match.getTeam1();
    } else if (result.getScoreTeam2() > result.getScoreTeam1()) {
      winner = match.getTeam2();
    }

    if (winner == null) return; // En cas de match nul (rare en élimination)

    Integer currentRound = match.getRound();
    if (currentRound == null) return;
    int nextRound = currentRound + 1;

    // Récupérer tous les matchs du tournoi
    List<Match> allMatches = matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(
        match.getTournament().getId()
    );

    List<Match> currentRoundMatches = allMatches.stream()
        .filter(m -> currentRound.equals(m.getRound()))
        .toList();

    List<Match> nextRoundMatches = allMatches.stream()
        .filter(m -> Integer.valueOf(nextRound).equals(m.getRound()))
        .toList();

    int matchIndex = -1;
    for (int i = 0; i < currentRoundMatches.size(); i++) {
      if (currentRoundMatches.get(i).getId().equals(match.getId())) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex == -1 || nextRoundMatches.isEmpty()) return;

    int targetMatchIndex = matchIndex / 2;
    if (targetMatchIndex >= nextRoundMatches.size()) return; // C'était la finale !

    Match nextMatch = nextRoundMatches.get(targetMatchIndex);

    // Assigne l'équipe dans le bon "slot" (team1 ou team2)
    if (matchIndex % 2 == 0) {
      nextMatch.setTeam1(winner);
    } else {
      nextMatch.setTeam2(winner);
    }

    matchRepository.save(nextMatch);
  }
  // -------------------------------------------------------------

  private void notifyTeamResponsibles(Match match, int score1, int score2) {
    String matchLabel = match.getTournament().getName() + " — "
        + match.getTeam1().getName() + " vs " + match.getTeam2().getName();
    String message = "Résultat encodé : " + matchLabel + " (" + score1 + " - " + score2
        + "). Veuillez confirmer ou contester ce résultat. #" + match.getId();
    notifyResponsibles(match.getTeam1(), match.getTeam2(), message);
  }

  private void notifyTeamResponsiblesDefinitive(Match match, int score1, int score2) {
    String matchLabel = match.getTournament().getName() + " — "
        + match.getTeam1().getName() + " vs " + match.getTeam2().getName();
    String message = "Résultat définitif : " + matchLabel + " (" + score1 + " - " + score2
        + "). Ce résultat est irrévocable. #" + match.getId();
    notifyResponsibles(match.getTeam1(), match.getTeam2(), message);
  }

  private void notifyResponsibles(Team team1, Team team2, String message) {
    if (team1 != null) {
      if (team1.getPrimaryResponsible() != null) notificationService.createNotification(team1.getPrimaryResponsible(), message);
      if (team1.getSecondaryResponsible() != null) notificationService.createNotification(team1.getSecondaryResponsible(), message);
    }
    if (team2 != null) {
      if (team2.getPrimaryResponsible() != null) notificationService.createNotification(team2.getPrimaryResponsible(), message);
      if (team2.getSecondaryResponsible() != null) notificationService.createNotification(team2.getSecondaryResponsible(), message);
    }
  }

  private void notifyAdminDispute(Match match, User admin, Team disputingTeam) {
    String message = "Contestation : l'équipe '" + disputingTeam.getName()
        + "' conteste le résultat du match " + match.getTournament().getName()
        + " — " + match.getTeam1().getName() + " vs " + match.getTeam2().getName()
        + ". Veuillez encoder un résultat définitif. #" + match.getId();
    notificationService.createNotification(admin, message);
  }
}