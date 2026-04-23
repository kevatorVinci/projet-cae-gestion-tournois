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

  /**
   * Constructor.
   *
   * @param matchResultRepository the result repository
   * @param matchRepository       the match repository
   * @param userRepository        the user repository
   * @param notificationService   the notification service
   */
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
   * Encodes a new result for a specific match. Sets match to WAITING_VALIDATION and notifies
   * both team responsibles.
   *
   * @param matchId the match id
   * @param dto     the data transfer object
   * @return the saved result, or null if match/admin not found
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
    result.setDefinitive(false);

    match.setStatus("WAITING_VALIDATION");
    matchRepository.save(match);

    MatchResult saved = matchResultRepository.save(result);

    notifyTeamResponsibles(match, dto.getScoreTeam1(), dto.getScoreTeam2());

    return saved;
  }

  /**
   * Handles a team's validation or dispute of a match result.
   * Each team can only act once. If disputed, match becomes DISPUTED and admin is notified.
   * If both teams validate, match becomes FINISHED.
   *
   * @param matchId  the match id
   * @param teamId   the id of the team validating or disputing
   * @param accepted true = validated, false = disputed
   * @return the updated result, or null if not found / already definitive / team not in match
   */
  @Transactional
  public MatchResult validateResult(Long matchId, Long teamId, boolean accepted) {
    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null) {
      return null;
    }

    if (result.isDefinitive()) {
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
    }

    return matchResultRepository.save(result);
  }

  /**
   * Admin re-encodes a definitive result after a dispute. No further dispute is possible.
   *
   * @param matchId the match id
   * @param dto     the new result data
   * @return the updated definitive result, or null if match/result not found or not in DISPUTED
   */
  @Transactional
  public MatchResult encodeDefinitiveResult(Long matchId, MatchResultCreateDto dto) {
    Match match = matchRepository.findById(matchId).orElse(null);
    User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

    if (match == null || admin == null) {
      return null;
    }

    if (!"DISPUTED".equals(match.getStatus())) {
      return null;
    }

    MatchResult result = matchResultRepository.findById(matchId).orElse(null);
    if (result == null) {
      return null;
    }

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
   * Runs every 5 minutes and auto-validates results older than 2 hours where teams haven't acted.
   */
  @Scheduled(fixedRate = 300000)
  @Transactional
  public void autoValidateResults() {
    LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);

    List<MatchResult> pendingResults = matchResultRepository
        .findPendingResultsOlderThan(twoHoursAgo);

    for (MatchResult res : pendingResults) {
      if (res.isDefinitive()) {
        continue;
      }
      res.setValidationStatusTeam1("VALIDATED");
      res.setValidationStatusTeam2("VALIDATED");
      res.getMatch().setStatus("FINISHED");
      matchRepository.save(res.getMatch());
      matchResultRepository.save(res);
    }
  }

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
    String message = "Contestation : l'équipe '" + disputingTeam.getName()
        + "' conteste le résultat du match " + match.getTournament().getName()
        + " — " + match.getTeam1().getName() + " vs " + match.getTeam2().getName()
        + ". Veuillez encoder un résultat définitif. #" + match.getId();
    notificationService.createNotification(admin, message);
  }
}
