package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
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
  private final NotificationRepository notificationRepository;

  /**
   * Constructor.
   *
   * @param matchResultRepository the result repository
   * @param matchRepository       the match repository
   * @param userRepository        the user repository
   * @param notificationRepository the notification repository
   */
  public MatchResultService(
          MatchResultRepository matchResultRepository,
          MatchRepository matchRepository,
          UserRepository userRepository,
          NotificationRepository notificationRepository) {
    this.matchResultRepository = matchResultRepository;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.notificationRepository = notificationRepository;
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
      Notification n = new Notification();
      n.setUser(team.getPrimaryResponsible());
      n.setMessage(message);
      n.setSentDate(LocalDateTime.now());
      n.setIsRead(false);
      notificationRepository.save(n);
    }

    if (team.getSecondaryResponsible() != null) {
      Notification n = new Notification();
      n.setUser(team.getSecondaryResponsible());
      n.setMessage(message);
      n.setSentDate(LocalDateTime.now());
      n.setIsRead(false); 
      notificationRepository.save(n);
    }
  }

  /**
   * Validates or rejects a match result by a team captain.
   */
  @Transactional
  public MatchResult validateResultByCaptain(Long matchId, Long teamId, boolean isAccepted) {
    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null) {
      return null;
    }

    Match match = result.getMatch();

    if (match.getTeam1() != null && match.getTeam1().getId().equals(teamId)) {
      result.setValidationStatusTeam1(isAccepted ? "VALIDATED" : "REJECTED");
    } else if (match.getTeam2() != null && match.getTeam2().getId().equals(teamId)) {
      result.setValidationStatusTeam2(isAccepted ? "VALIDATED" : "REJECTED");
    }

    if (!isAccepted) {
      match.setStatus("DISPUTED");
    } else if ("VALIDATED".equals(result.getValidationStatusTeam1())
            && "VALIDATED".equals(result.getValidationStatusTeam2())) {
      match.setStatus("FINISHED");
    }

    matchRepository.save(match);
    return matchResultRepository.save(result);
  }

  /**
   * Finds a result for a specific match.
   */
  public MatchResult getResultForMatch(Long matchId) {
    return matchResultRepository.findById(matchId).orElse(null);
  }

  /**
   * This robot runs every 5 minutes (300000 milliseconds).
   * It checks for results older than 2 hours and validates them automatically.
   */
  @Scheduled(fixedRate = 300000)
  @Transactional
  public void autoValidateResults() {
    LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);

    List<MatchResult> pendingResults = matchResultRepository
            .findPendingResultsOlderThan(twoHoursAgo);

    for (MatchResult res : pendingResults) {
      res.setValidationStatusTeam1("VALIDATED");
      res.setValidationStatusTeam2("VALIDATED");

      res.getMatch().setStatus("FINISHED");
      matchRepository.save(res.getMatch());

      matchResultRepository.save(res);

      System.out.println("🤖 ROBOT : Le match #" + res.getMatch().getId()
              + " a été validé automatiquement après 2 heures !");
    }
  }
}