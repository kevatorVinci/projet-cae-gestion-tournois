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
  private final MatchService matchService;

  /**
   * Constructor.
   *
   * @param matchResultRepository the result repository
   * @param matchRepository       the match repository
   * @param userRepository        the user repository
   * @param notificationRepository the notification repository
   * @param matchService          the match service for bracket advancement
   */
  public MatchResultService(
        MatchResultRepository matchResultRepository,
        MatchRepository matchRepository,
        UserRepository userRepository,
        NotificationRepository notificationRepository,
        MatchService matchService) {
    this.matchResultRepository = matchResultRepository;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.notificationRepository = notificationRepository;
    this.matchService = matchService;
  }

  /**
   * Encodes a new result for a specific match and prepares notifications.
   *
   * @param matchId the match id
   * @param dto     the data transfer object containing the score
   * @return the saved result
   */
  @Transactional
  public MatchResult encodeResult(Long matchId, MatchResultCreateDto dto) {
    Match match = matchRepository.findById(matchId).orElse(null);
    User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

    if (match == null || admin == null) {
      return null;
    }

    MatchResult result = new MatchResult();
    result.setMatch(match);
    result.setAdminEncoder(admin);
    result.setScoreTeam1(dto.getScoreTeam1());
    result.setScoreTeam2(dto.getScoreTeam2());
    result.setForfeitTeam1(dto.isForfeitTeam1());
    result.setForfeitTeam2(dto.isForfeitTeam2());
    result.setEncodingDate(LocalDateTime.now());
    result.setValidationStatusTeam1("PENDING");
    result.setValidationStatusTeam2("PENDING");

    match.setStatus("WAITING_VALIDATION");
    matchRepository.save(match);

    MatchResult savedResult = matchResultRepository.save(result);

    User leaderTeam1 = match.getTeam1() != null ? match.getTeam1().getPrimaryResponsible() : null;
    User leaderTeam2 = match.getTeam2() != null ? match.getTeam2().getPrimaryResponsible() : null;

    if (leaderTeam1 != null) {
      String team2Name = match.getTeam2() != null ? match.getTeam2().getName() : "une équipe";
      Notification notifTeam1 = new Notification();
      notifTeam1.setUser(leaderTeam1);
      notifTeam1.setMessage("Le score du match #" + matchId + " contre " + team2Name
          + " a été encodé. Vous avez 2 heures pour valider ou contester.");
      notificationRepository.save(notifTeam1);
    }

    if (leaderTeam2 != null) {
      String team1Name = match.getTeam1() != null ? match.getTeam1().getName() : "une équipe";
      Notification notifTeam2 = new Notification();
      notifTeam2.setUser(leaderTeam2);
      notifTeam2.setMessage("Le score du match #" + matchId + " contre " + team1Name
          + " a été encodé. Vous avez 2 heures pour valider ou contester.");
      notificationRepository.save(notifTeam2);
    }

    return savedResult;
  }

  /**
   * Validates or rejects a match result by a team captain.
   *
   * @param matchId the ID of the match to validate.
   * @param teamId the ID of the team validating.
   * @param isAccepted true if the score is accepted, false if rejected.
   * @return the updated MatchResult.
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
    MatchResult saved = matchResultRepository.save(result);

    if ("FINISHED".equals(match.getStatus())) {
      Team winner = result.getScoreTeam1() > result.getScoreTeam2()
          ? match.getTeam1() : match.getTeam2();
      matchService.advanceWinnerToNextRound(match, winner);
    }

    return saved;
  }

  /**
   * Finds a result for a specific match.
   *
   * @param matchId the match id
   * @return the match result
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

      Match match = res.getMatch();
      match.setStatus("FINISHED");
      matchRepository.save(match);
      matchResultRepository.save(res);

      Team winner = res.getScoreTeam1() > res.getScoreTeam2()
          ? match.getTeam1() : match.getTeam2();
      matchService.advanceWinnerToNextRound(match, winner);

      System.out.println("🤖 ROBOT : Le match #" + match.getId()
          + " a été validé automatiquement après 2 heures !");
    }
  }
}