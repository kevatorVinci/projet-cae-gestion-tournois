package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState; // 🇬🇧 Ancien : EtatDemande
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling the business logic of team join requests.
 * Centralizes request creation, validation (accept/reject), and strict rule
 * enforcement
 * (for example, checking that the player is not already in a team).
 */
@Service
public class DemandService {

  private final DemandRepository demandRepo; // 🇬🇧 Ancien : demandeRepo
  private final UserRepository userRepo;
  private final TeamRepository teamRepo; // 🇬🇧 Ancien : equipeRepo
  private final NotificationService notificationService;

  /**
   * Builds the service with required dependencies.
   *
   * @param demandRepo          request repository
   * @param userRepo            user repository
   * @param teamRepo            team repository
   * @param notificationService notification service
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
   * Automatically checks whether the player already belongs to a team before
   * saving the request.
   *
   * @param memberId unique ID of the player applying
   * @param teamId   unique ID of the target team
   * @return newly created and saved request with PENDING status
   * @throws RuntimeException if the player does not exist, the team does not
   *                          exist, or the player
   *                          already belongs to a team
   */
  public Demand createJoinRequest(Long memberId, Long teamId) {
    User member = userRepo
      .findById(memberId)
      .orElseThrow(() -> new RuntimeException("Player not found"));

    Team team = teamRepo
      .findById(teamId)
      .orElseThrow(() -> new RuntimeException("Team not found"));

    // 🇬🇧 Updated to use getTeam()
    if (member.getTeam() != null) {
      throw new RuntimeException("You already have a team!");
    }

    // 🇬🇧 Updated to use English getters
    boolean hasNoResponsible = team.getPrimaryResponsible() == null
      && team.getSecondaryResponsible() == null;
    if (hasNoResponsible) {
      throw new RuntimeException("The team has no responsible.");
    }

    if (!isTeamEligibleForJoin(team)) {
      throw new RuntimeException("This team is no longer available for requests.");
    }

    // 🇬🇧 Updated repository method call and state
    if (demandRepo.existsByMemberIdAndTeamIdAndState(
      memberId, teamId, DemandState.PENDING)) {
      throw new RuntimeException("A pending request already exists for this team.");
    }

    Demand demand = new Demand();
    demand.setMember(member); // 🇬🇧 Ancien : setMembre
    demand.setTeam(team); // 🇬🇧 Ancien : setEquipe
    demand.setState(DemandState.PENDING); // 🇬🇧 Ancien : setEtat(EtatDemande.EN_ATTENTE)

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
   * Useful for the team responsible user's dashboard.
   *
   * @param teamId team ID used to filter requests
   * @return iterable collection containing only PENDING requests
   */
  @Transactional
  public Iterable<Demand> getPendingRequestsForTeam(Long teamId) { // 🇬🇧 Ancien : getDemandesEnAttentePourEquipe
    Team team = teamRepo.findById(teamId).orElse(null);
    if (team != null && !isTeamEligibleForJoin(team)) {
      // Defensive cleanup: avoid orphan notifications for an invalid team.
      // 🇬🇧 Updated repository method and state
      demandRepo.deleteByTeamIdAndState(teamId, DemandState.PENDING);
      return List.of();
    }
    // 🇬🇧 Updated repository method and state
    return demandRepo.findByTeamIdAndState(teamId, DemandState.PENDING);
  }

  /**
   * Returns pending demands for the current responsible user's team.
   *
   * @param currentUser authenticated user
   * @return pending demands for current user's team
   */
  @Transactional
  public Iterable<Demand> getPendingRequestsForResponsible(User currentUser) { // 🇬🇧 Ancien : getDemandesEnAttentePourResponsable
    if (currentUser == null) {
      throw new SecurityException("Unauthenticated user.");
    }

    // 🇬🇧 Updated getter
    Team team = currentUser.getTeam();

    // Primary path: use membership relation when available and valid.
    if (team != null) {
      verifyUserIsResponsible(team, currentUser);
      return getPendingRequestsForTeam(team.getId());
    }

    // Fallback path: handles inconsistent data where user.team is null but
    // the user is still configured as primary/secondary responsible.
    // 🇬🇧 Updated repository method
    team = teamRepo
      .findByPrimaryResponsibleIdOrSecondaryResponsibleId(
        currentUser.getId(), currentUser.getId())
      .orElseThrow(() -> new SecurityException("You are not responsible for any team."));

    return getPendingRequestsForTeam(team.getId());
  }

  /**
   * Officially accepts a player's request.
   * Updates request status, stores processing date, and immediately assigns the
   * player
   * to the new team in the database.
   *
   * @param demandId    ID of the request to validate
   * @param currentUser the authenticated user processing the request
   * @return updated request with ACCEPTED status
   * @throws RuntimeException if the specified request does not exist
   */
  @Transactional
  public Demand acceptDemand(Long demandId, User currentUser) { // 🇬🇧 Ancien : accepterDemande
    Demand demand = getAndVerifyDemand(demandId, currentUser);
    Team team = demand.getTeam(); // 🇬🇧 Ancien : getEquipe

    if (!isTeamEligibleForJoin(team)) {
      throw new RuntimeException("The target team is no longer available.");
    }

    demand.setState(DemandState.ACCEPTED); // 🇬🇧 Ancien : setEtat(EtatDemande.ACCEPTEE)
    demand.setProcessingDate(LocalDateTime.now()); // 🇬🇧 Ancien : setDateTraitement

    User user = demand.getMember(); // 🇬🇧 Ancien : getMembre
    if (user.getTeam() != null) { // 🇬🇧 Ancien : getEquipe
      throw new RuntimeException("The player already belongs to a team.");
    }

    user.setTeam(team);
    team.getMembers().add(user); // 🇬🇧 Ancien : getMembres()
    userRepo.save(user);
    teamRepo.save(team);

    // Save the accepted request FIRST
    Demand savedDemand = demandRepo.save(demand);

    // THEN remove other pending requests for this user
    // 🇬🇧 Updated repository method and state
    demandRepo.deleteByMemberIdAndState(user.getId(), DemandState.PENDING);

    notificationService.notifyRequestAccepted(user, team.getName());
    return savedDemand;
  }

  /**
   * Rejects a player's request with a rejection reason.
   * Updates request history without affecting the player's current team.
   *
   * @param demandId    ID of the request to reject
   * @param reason      text explaining the rejection reason (for example:
   *                    "Insufficient level")
   * @param currentUser the authenticated user processing the request
   * @return updated request with REJECTED status and reason
   * @throws RuntimeException if the specified request does not exist
   */
  @Transactional
  public Demand rejectDemand(Long demandId, String reason, User currentUser) {
    Demand demand = getAndVerifyDemand(demandId, currentUser);
    String normalizedReason = (reason == null || reason.isBlank())
      ? "No specific reason provided." // 🇬🇧 Translated default reason
      : reason.trim();

    demand.setState(DemandState.REJECTED); // 🇬🇧 Ancien : setEtat(EtatDemande.REFUSEE)
    demand.setRejectionReason(normalizedReason); // 🇬🇧 Ancien : setRaisonRefus
    demand.setProcessingDate(LocalDateTime.now()); // 🇬🇧 Ancien : setDateTraitement

    Demand savedDemand = demandRepo.save(demand);
    notificationService.notifyRequestDenied(
      demand.getMember(), demand.getTeam().getName(), normalizedReason); // 🇬🇧 Ancien : getMembre, getEquipe
    return savedDemand;
  }

  /**
   * Retrieves a request and verifies that the user is responsible for the team.
   *
   * @param demandId    request ID
   * @param currentUser current user
   * @return matching request
   * @throws RuntimeException  if the request does not exist
   * @throws SecurityException if the user is not responsible
   */
  private Demand getAndVerifyDemand(Long demandId, User currentUser) { // 🇬🇧 Ancien : getAndVerifyDemande
    Demand demand = demandRepo
      .findById(demandId)
      .orElseThrow(() -> new RuntimeException("Request not found"));
    verifyUserIsResponsible(demand.getTeam(), currentUser); // 🇬🇧 Ancien : getEquipe
    return demand;
  }

  /**
   * Verifies that the current user is a responsible member (primary or secondary)
   * of the team.
   *
   * @param team        team to validate
   * @param currentUser current user
   * @throws SecurityException if the user is not responsible for the team
   */
  private void verifyUserIsResponsible(Team team, User currentUser) {
    // 🇬🇧 Updated to use English getters
    // 1. Check whether the user is the primary responsible (if present)
    boolean isPrimary = team.getPrimaryResponsible() != null
      && team.getPrimaryResponsible().getId().equals(currentUser.getId());

    // 2. Check whether the user is the secondary responsible (if present)
    boolean isSecondary = team.getSecondaryResponsible() != null
      && team.getSecondaryResponsible().getId().equals(currentUser.getId());

    // 3. Apply final decision logic (neither primary nor secondary)
    if (!isPrimary && !isSecondary) {
      throw new SecurityException("Only the team responsible can manage members.");
    }
  }

  private boolean isTeamEligibleForJoin(Team team) { // 🇬🇧 Ancien : isEquipeEligibleForJoin
    if (team == null) {
      return false;
    }
    // 🇬🇧 Updated to use English getters
    return team.getPrimaryResponsible() != null || team.getSecondaryResponsible() != null;
  }
}