package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service handling the business logic of team join requests.
 * Centralizes request creation, validation, and strict rule enforcement.
 */
@Service
public class DemandService {

  /**
   * Repository for managing demand persistence.
   */
  private final DemandRepository demandRepo;

  /**
   * Repository for managing user persistence.
   */
  private final UserRepository userRepo;

  /**
   * Repository for managing team persistence.
   */
  private final TeamRepository teamRepo;

  /**
   * Service for sending notifications.
   */
  private final NotificationService notificationService;

  /**
   * Builds the service with required dependencies.
   *
   * @param demandRepo          the request repository.
   * @param userRepo            the user repository.
   * @param teamRepo            the team repository.
   * @param notificationService the notification service.
   */
  public DemandService(
          DemandRepository demandRepo,
          UserRepository userRepo,
          TeamRepository teamRepo,
          NotificationService notificationService) {
    this.demandRepo = demandRepo;
    this.userRepo = userRepo;
    this.teamRepo = teamRepo;
    this.notificationService = notificationService;
  }

  /**
   * Creates a new join request for a player who wants to join a team.
   *
   * @param memberId unique ID of the player applying.
   * @param teamId   unique ID of the target team.
   * @return newly created and saved request with PENDING status.
   * @throws RuntimeException if the player or team does not exist, or rules are violated.
   */
  public Demand createJoinRequest(Long memberId, Long teamId) {
    User member = userRepo
            .findById(memberId)
            .orElseThrow(() -> new RuntimeException("Player not found"));

    Team team = teamRepo
            .findById(teamId)
            .orElseThrow(() -> new RuntimeException("Team not found"));

    if (member.getTeam() != null) {
      throw new RuntimeException("You already have a team!");
    }

    boolean hasNoResponsible = team.getPrimaryResponsible() == null
            && team.getSecondaryResponsible() == null;
    if (hasNoResponsible) {
      throw new RuntimeException("The team has no responsible.");
    }

    if (!isTeamEligibleForJoin(team)) {
      throw new RuntimeException("This team is no longer available for requests.");
    }

    if (demandRepo.existsByMemberIdAndTeamIdAndState(
            memberId, teamId, DemandState.PENDING)) {
      throw new RuntimeException("A pending request already exists for this team.");
    }

    Demand demand = new Demand();
    demand.setMember(member);
    demand.setTeam(team);
    demand.setState(DemandState.PENDING);

    Demand savedDemand = demandRepo.save(demand);
    notificationService.sendApplicationNotification(member, team.getName());

    if (team.getPrimaryResponsible() != null) {
      notificationService.notifyNewRequestToManager(
              team.getPrimaryResponsible(), member.getTag(), team.getName());
    }
    return savedDemand;
  }

  /**
   * Gets all pending requests for a given team.
   *
   * @param teamId team ID used to filter requests.
   * @return iterable collection containing only PENDING requests.
   */
  @Transactional
  public Iterable<Demand> getPendingRequestsForTeam(Long teamId) {
    Team team = teamRepo.findById(teamId).orElse(null);
    if (team != null && !isTeamEligibleForJoin(team)) {
      demandRepo.deleteByTeamIdAndState(teamId, DemandState.PENDING);
      return List.of();
    }
    return demandRepo.findByTeamIdAndState(teamId, DemandState.PENDING);
  }

  /**
   * Returns pending demands for the current responsible user's team.
   *
   * @param currentUser authenticated user.
   * @return pending demands for current user's team.
   * @throws SecurityException if the user is unauthenticated or not a responsible.
   */
  @Transactional
  public Iterable<Demand> getPendingRequestsForResponsible(User currentUser) {
    if (currentUser == null) {
      throw new SecurityException("Unauthenticated user.");
    }

    Team team = currentUser.getTeam();

    if (team != null) {
      verifyUserIsResponsible(team, currentUser);
      return getPendingRequestsForTeam(team.getId());
    }

    team = teamRepo
            .findByPrimaryResponsibleIdOrSecondaryResponsibleId(
                    currentUser.getId(), currentUser.getId())
            .orElseThrow(() -> new SecurityException("You are not responsible for any team."));

    return getPendingRequestsForTeam(team.getId());
  }

  /**
   * Officially accepts a player's request.
   *
   * @param demandId    ID of the request to validate.
   * @param currentUser the authenticated user processing the request.
   * @return updated request with ACCEPTED status.
   * @throws RuntimeException if the specified request does not exist.
   */
  @Transactional
  public Demand acceptDemand(Long demandId, User currentUser) {
    Demand demand = getAndVerifyDemand(demandId, currentUser);
    Team team = demand.getTeam();

    if (!isTeamEligibleForJoin(team)) {
      throw new RuntimeException("The target team is no longer available.");
    }

    demand.setState(DemandState.ACCEPTED);
    demand.setProcessingDate(LocalDateTime.now());

    User user = demand.getMember();
    if (user.getTeam() != null) {
      throw new RuntimeException("The player already belongs to a team.");
    }

    user.setTeam(team);
    team.getMembers().add(user);
    userRepo.save(user);
    teamRepo.save(team);

    Demand savedDemand = demandRepo.save(demand);

    demandRepo.deleteByMemberIdAndState(user.getId(), DemandState.PENDING);

    notificationService.notifyRequestAccepted(user, team.getName());
    return savedDemand;
  }

  /**
   * Rejects a player's request with a rejection reason.
   *
   * @param demandId    ID of the request to reject.
   * @param reason      text explaining the rejection reason.
   * @param currentUser the authenticated user processing the request.
   * @return updated request with REJECTED status and reason.
   * @throws RuntimeException if the specified request does not exist.
   */
  @Transactional
  public Demand rejectDemand(Long demandId, String reason, User currentUser) {
    Demand demand = getAndVerifyDemand(demandId, currentUser);
    String normalizedReason = (reason == null || reason.isBlank())
            ? "No specific reason provided."
            : reason.trim();

    demand.setState(DemandState.REJECTED);
    demand.setRejectionReason(normalizedReason);
    demand.setProcessingDate(LocalDateTime.now());

    Demand savedDemand = demandRepo.save(demand);
    notificationService.notifyRequestDenied(
            demand.getMember(), demand.getTeam().getName(), normalizedReason);
    return savedDemand;
  }

  /**
   * Retrieves a request and verifies that the user is responsible for the team.
   *
   * @param demandId    request ID.
   * @param currentUser current user.
   * @return matching request.
   * @throws RuntimeException  if the request does not exist.
   * @throws SecurityException if the user is not responsible.
   */
  private Demand getAndVerifyDemand(Long demandId, User currentUser) {
    Demand demand = demandRepo
            .findById(demandId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
    verifyUserIsResponsible(demand.getTeam(), currentUser);
    return demand;
  }

  /**
   * Verifies that the current user is a responsible member of the team.
   *
   * @param team        team to validate.
   * @param currentUser current user.
   * @throws SecurityException if the user is not responsible for the team.
   */
  private void verifyUserIsResponsible(Team team, User currentUser) {
    boolean isPrimary = team.getPrimaryResponsible() != null
            && team.getPrimaryResponsible().getId().equals(currentUser.getId());

    boolean isSecondary = team.getSecondaryResponsible() != null
            && team.getSecondaryResponsible().getId().equals(currentUser.getId());

    if (!isPrimary && !isSecondary) {
      throw new SecurityException("Only the team responsible can manage members.");
    }
  }

  /**
   * Checks if a team is eligible to receive join requests.
   *
   * @param team the team to check.
   * @return true if eligible, false otherwise.
   */
  private boolean isTeamEligibleForJoin(Team team) {
    if (team == null) {
      return false;
    }
    return team.getPrimaryResponsible() != null || team.getSecondaryResponsible() != null;
  }
}