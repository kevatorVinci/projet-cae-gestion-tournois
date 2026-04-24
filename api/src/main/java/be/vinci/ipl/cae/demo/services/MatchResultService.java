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

/** Service handling business logic for match results. */
@Service
public class MatchResultService {

  private final MatchResultRepository matchResultRepository;
  private final MatchRepository matchRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;
  private final MatchService matchService;

  /** Builds the match-result service. */
  public MatchResultService(
      MatchResultRepository matchResultRepository,
      MatchRepository matchRepository,
      UserRepository userRepository,
      NotificationService notificationService,
      MatchService matchService) {
    this.matchResultRepository = matchResultRepository;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.matchService = matchService;
  }

  /**
   * Encodes the result of a match (by an admin). If a result already exists (e.g., disputed match),
   * updates it instead of creating a new one.
   */
  @Transactional
  public MatchResult encodeResult(Long matchId, MatchResultCreateDto dto) {
    Match match =
        matchRepository
            .findById(matchId)
            .orElseThrow(() -> new IllegalArgumentException("Match introuvable."));

    ensureMatchCanBeEncoded(match);
    ensureNonDraw(dto);

    MatchResult result = matchResultRepository.findById(matchId).orElse(null);

    if (result == null) {
      result = new MatchResult();
      result.setMatch(match);
      result.setId(match.getId());
    }

    applyEncodedResultFields(result, dto);
    User admin =
        userRepository
            .findById(dto.getAdminEncoderId())
            .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable."));
    result.setAdminEncoder(admin);
    result.setEncodingDate(LocalDateTime.now());

    if (dto.isForfeitTeam1() || dto.isForfeitTeam2()) {
      result.setValidationStatusTeam1("VALIDATED");
      result.setValidationStatusTeam2("VALIDATED");
      match.setStatus("FINISHED");
    } else {
      result.setValidationStatusTeam1("PENDING");
      result.setValidationStatusTeam2("PENDING");
      match.setStatus("WAITING_VALIDATION");
    }

    matchRepository.save(match);
    MatchResult savedResult = matchResultRepository.save(result);

    if (dto.isForfeitTeam1() || dto.isForfeitTeam2()) {
      matchService.advanceWinnerToNextRound(match, savedResult);
    } else {
      String messageNotif =
          "Le score du match #" + match.getId() + " a été encodé. Allez le valider !";
      envoyerNotifAuxCapitaines(match.getTeam1(), messageNotif);
      envoyerNotifAuxCapitaines(match.getTeam2(), messageNotif);
    }

    return savedResult;
  }

  private void envoyerNotifAuxCapitaines(Team team, String message) {
    if (team == null) {
      return;
    }
    if (team.getPrimaryResponsible() != null) {
      notificationService.createNotification(team.getPrimaryResponsible(), message);
    }
    if (team.getSecondaryResponsible() != null) {
      notificationService.createNotification(team.getSecondaryResponsible(), message);
    }
  }

  /** Validates or rejects a match result by a team captain. */
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
      if (!"PENDING".equals(result.getValidationStatusTeam1())) {
        return null;
      }
      result.setValidationStatusTeam1(newStatus);
    } else {
      if (!"PENDING".equals(result.getValidationStatusTeam2())) {
        return null;
      }
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
      matchService.advanceWinnerToNextRound(match, result);
    }

    return matchResultRepository.save(result);
  }

  /** Encodes a final decision for a disputed match result. */
  @Transactional
  public MatchResult encodeDefinitiveResult(Long matchId, MatchResultCreateDto dto) {
    Match match = matchRepository.findById(matchId).orElse(null);
    User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

    if (match == null || admin == null || !"DISPUTED".equals(match.getStatus())) {
      return null;
    }

    ensureMatchCanBeEncoded(match);
    ensureNonDraw(dto);

    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null) {
      return null;
    }

    result.setAdminEncoder(admin);
    applyEncodedResultFields(result, dto);
    result.setValidationStatusTeam1("VALIDATED");
    result.setValidationStatusTeam2("VALIDATED");
    result.setDefinitive(true);

    match.setStatus("FINISHED");
    matchRepository.save(match);
    MatchResult saved = matchResultRepository.save(result);

    notifyTeamResponsiblesDefinitive(match, dto.getScoreTeam1(), dto.getScoreTeam2());
    matchService.advanceWinnerToNextRound(match, saved);

    return saved;
  }

  private void ensureMatchCanBeEncoded(Match match) {
    String currentStatus = match.getStatus() == null ? "" : match.getStatus().toUpperCase();
    if ("FINISHED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
      throw new IllegalStateException(
          "Ce match est déjà finalisé par forfait ou résultat validé. Encodage impossible.");
    }
  }

  private void ensureNonDraw(MatchResultCreateDto dto) {
    if (!dto.isForfeitTeam1()
        && !dto.isForfeitTeam2()
        && dto.getScoreTeam1() == dto.getScoreTeam2()) {
      throw new IllegalStateException("Impossible d'encoder un match nul.");
    }
  }

  /** Finds a result for a specific match. */
  public MatchResult getResultForMatch(Long matchId) {
    return matchResultRepository.findById(matchId).orElse(null);
  }

  /** Auto-validates stale pending results older than two hours. */
  @Scheduled(fixedRate = 300000)
  @Transactional
  public void autoValidateResults() {
    LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
    List<MatchResult> pendingResults =
        matchResultRepository.findPendingResultsOlderThan(twoHoursAgo);

    for (MatchResult res : pendingResults) {
      if (res.isDefinitive()) {
        continue;
      }

      res.setValidationStatusTeam1("VALIDATED");
      res.setValidationStatusTeam2("VALIDATED");

      Match match = res.getMatch();
      match.setStatus("FINISHED");
      matchRepository.save(match);
      matchResultRepository.save(res);

      matchService.advanceWinnerToNextRound(match, res);

      System.out.println(
          "🤖 ROBOT : Le match #" + match.getId() + " a été validé automatiquement après 2 heures !");
    }
  }

  private void notifyTeamResponsiblesDefinitive(Match match, int score1, int score2) {
    String matchLabel =
        match.getTournament().getName()
            + " — "
            + match.getTeam1().getName()
            + " vs "
            + match.getTeam2().getName();
    String message =
        "Résultat définitif : "
            + matchLabel
            + " ("
            + score1
            + " - "
            + score2
            + "). Ce résultat est irrévocable. #"
            + match.getId();
    notifyResponsibles(match.getTeam1(), match.getTeam2(), message);
  }

  private void notifyResponsibles(Team team1, Team team2, String message) {
    if (team1 != null) {
      if (team1.getPrimaryResponsible() != null) {
        notificationService.createNotification(team1.getPrimaryResponsible(), message);
      }
      if (team1.getSecondaryResponsible() != null) {
        notificationService.createNotification(team1.getSecondaryResponsible(), message);
      }
    }
    if (team2 != null) {
      if (team2.getPrimaryResponsible() != null) {
        notificationService.createNotification(team2.getPrimaryResponsible(), message);
      }
      if (team2.getSecondaryResponsible() != null) {
        notificationService.createNotification(team2.getSecondaryResponsible(), message);
      }
    }
  }

  private void notifyAdminDispute(Match match, User admin, Team disputingTeam) {
    String message =
        "Contestation : l'équipe '"
            + disputingTeam.getName()
            + "' conteste le résultat du match "
            + match.getTournament().getName()
            + " — "
            + match.getTeam1().getName()
            + " vs "
            + match.getTeam2().getName()
            + ". Veuillez encoder un résultat définitif. #"
            + match.getId();
    notificationService.createNotification(admin, message);
  }

  private void applyEncodedResultFields(MatchResult result, MatchResultCreateDto dto) {
    result.setScoreTeam1(dto.getScoreTeam1());
    result.setScoreTeam2(dto.getScoreTeam2());
    result.setForfeitTeam1(dto.isForfeitTeam1());
    result.setForfeitTeam2(dto.isForfeitTeam2());
    result.setEncodingDate(LocalDateTime.now());
  }
}
