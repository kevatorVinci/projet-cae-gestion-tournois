package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service managing the business logic related to teams. */
@Service
public class TeamService {

  /** Repository for team data access. */
  private final TeamRepository teamRepository;

  /** Repository for user data access. */
  private final UserRepository userRepository;

  /** Service for handling join requests. */
  private final DemandService demandService;

  /** Service for sending notifications. */
  private final NotificationService notificationService;

  /** Service for cleaning up future lineup selections. */
  private final PlayerSelectionCleanupService playerSelectionCleanupService;

  /**
   * Constructor for TeamService.
   *
   * @param teamRepository the team repository.
   * @param userRepository the user repository.
   * @param demandService the demand service.
   * @param notificationService the notification service.
   */
  public TeamService(
      TeamRepository teamRepository,
      UserRepository userRepository,
      DemandService demandService,
      NotificationService notificationService,
      PlayerSelectionCleanupService playerSelectionCleanupService) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
    this.demandService = demandService;
    this.notificationService = notificationService;
    this.playerSelectionCleanupService = playerSelectionCleanupService;
  }

  /**
   * Retrieves all existing teams.
   *
   * @return an Iterable containing all teams.
   */
  public Iterable<Team> getAllTeams() {
    return teamRepository.findAll();
  }

  /**
   * Retrieves only active teams (those with at least 1 member).
   *
   * @return an Iterable containing the active teams.
   */
  public Iterable<Team> getActiveTeams() {
    return teamRepository.findByMembersIsNotEmpty();
  }

  /**
   * Retrieves a team by its identifier.
   *
   * @param id the team identifier.
   * @return an Optional containing the team if it exists.
   */
  public Optional<Team> getTeamById(Long id) {
    return teamRepository.findById(id);
  }

  /**
   * Allows a user to create a team and become primary responsible.
   *
   * @param user the user creating the team.
   * @param teamName the unique name of the team.
   * @param profileImage the profile image URL or path.
   * @return the saved team, or null if name already exists.
   * @throws IllegalStateException if the user already belongs to a team.
   */
  public Team createTeam(User user, String teamName, String profileImage) {
    if (user.getTeam() != null) {
      throw new IllegalStateException("Ce membre appartient déjà à une équipe.");
    }

    if (teamRepository.existsByName(teamName)) {
      return null;
    }

    User userPersisted = userRepository.save(user);

    Team team = new Team();
    team.setName(teamName);
    team.setProfileImage(profileImage);
    team.setPrimaryResponsible(userPersisted);
    team.getMembers().add(userPersisted);

    Team savedTeam = teamRepository.save(team);
    notificationService.notifyTeamCreation(userPersisted, savedTeam.getName());
    userPersisted.setTeam(savedTeam);
    userRepository.save(userPersisted);

    return savedTeam;
  }

  /**
   * Allows a user to request joining an existing team.
   *
   * @param user the user who wants to join.
   * @param teamId the unique identifier of the team.
   */
  public void requestJoinTeam(User user, Long teamId) {
    demandService.createJoinRequest(user.getId(), teamId);
  }

  /**
   * Checks whether the given user is one of the team responsibles.
   *
   * @param team the team to check.
   * @param user the user to check.
   * @return true if the user is a responsible, false otherwise.
   */
  public boolean isUserResponsible(Team team, User user) {
    if (team == null || user == null) {
      return false;
    }

    Long userId = user.getId();
    boolean isPrimary =
        team.getPrimaryResponsible() != null && team.getPrimaryResponsible().getId().equals(userId);

    boolean isSecondary =
        team.getSecondaryResponsible() != null
            && team.getSecondaryResponsible().getId().equals(userId);

    return isPrimary || isSecondary;
  }

  /**
   * Checks whether the current user is a team leader.
   *
   * @param currentUser the authenticated user.
   * @return true if responsible, false otherwise.
   */
  public boolean isCurrentUserResponsible(User currentUser) {
    try {
      User persistedCurrentUser = loadPersistedUser(currentUser);
      Team userTeam = resolveCurrentUserTeam(persistedCurrentUser);
      return isUserResponsible(userTeam, persistedCurrentUser);
    } catch (IllegalStateException e) {
      return false;
    }
  }

  /**
   * Promotes a team member to a responsible role.
   *
   * @param currentUser the authenticated user performing the action.
   * @param memberId the ID of the member to promote.
   * @throws IllegalStateException if the user is already responsible or team is full.
   */
  @Transactional
  public void promoteTeamMember(User currentUser, Long memberId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team team = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(team, persistedCurrentUser);

    User member = findMemberInTeam(team, memberId);
    if (isUserResponsible(team, member)) {
      throw new IllegalStateException("Ce membre est déjà responsable.");
    }

    if (team.getPrimaryResponsible() == null) {
      team.setPrimaryResponsible(member);
    } else if (team.getSecondaryResponsible() == null) {
      team.setSecondaryResponsible(member);
    } else {
      throw new IllegalStateException("The team already has the max number of responsibles.");
    }

    teamRepository.save(team);
  }

  /**
   * Removes a responsible role from a team member.
   *
   * @param currentUser the authenticated user performing the action.
   * @param memberId the ID of the member to demote.
   * @throws IllegalStateException if the member is not responsible or is the last one.
   */
  @Transactional
  public void demoteTeamLeader(User currentUser, Long memberId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team team = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(team, persistedCurrentUser);

    User member = findMemberInTeam(team, memberId);
    if (!isUserResponsible(team, member)) {
      throw new IllegalStateException("Ce membre n'est pas responsable.");
    }

    if (countResponsibles(team) <= 1) {
      throw new IllegalStateException("Impossible de rétrograder le dernier responsable.");
    }

    removeResponsibleRole(team, member.getId());
    normalizeResponsibleSlots(team);
    teamRepository.save(team);
  }

  /**
   * Excludes a member from the current user's team.
   *
   * @param currentUser the authenticated user performing the action.
   * @param memberId the ID of the member to exclude.
   * @throws IllegalStateException if the member is not in the team or the user is not allowed.
   */
  @Transactional
  public void kickMember(User currentUser, Long memberId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team team = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(team, persistedCurrentUser);

    if (persistedCurrentUser.getId().equals(memberId)) {
      throw new IllegalStateException("Vous ne pouvez pas vous exclure vous-même.");
    }

    User member = findMemberInTeam(team, memberId);

    if (isUserResponsible(team, member) && countResponsibles(team) <= 1) {
      throw new IllegalStateException("Impossible d'exclure le dernier responsable.");
    }

    removeResponsibleRole(team, member.getId());
    normalizeResponsibleSlots(team);
    team.getMembers().removeIf(teamMember -> teamMember.getId().equals(member.getId()));
    member.setTeam(null);
    playerSelectionCleanupService.removeMemberFromFutureSelections(member.getId());

    userRepository.save(member);
    teamRepository.save(team);
  }

  /**
   * Allows a user to leave their team.
   *
   * @param user the user who wants to leave.
   * @param newResponsibleId the ID of the new responsible if needed.
   * @throws IllegalStateException if rules are violated during the process.
   */
  @Transactional
  public void leaveTeam(User user, Long newResponsibleId) {
    User persistedUser =
        userRepository
            .findById(user.getId())
            .orElseThrow(
                () -> new IllegalStateException("The member does not belong to any team."));

    Team team = resolveCurrentUserTeam(persistedUser);

    boolean isResponsible = isUserResponsible(team, persistedUser);
    List<User> members = team.getMembers();

    if (isResponsible && members.size() == 1) {
      team.getMembers().clear();

      persistedUser.setTeam(null);
      team.setPrimaryResponsible(null);
      team.setSecondaryResponsible(null);
      playerSelectionCleanupService.removeMemberFromFutureSelections(persistedUser.getId());

      userRepository.save(persistedUser);
      teamRepository.save(team);
      return;
    }

    if (isResponsible) {
      boolean onlyResponsible = countResponsibles(team) == 1;
      if (onlyResponsible) {
        if (newResponsibleId == null) {
          throw new IllegalStateException("Vous devez désigner un remplaçant.");
        }

        User newResponsible = findMemberInTeam(team, newResponsibleId);
        if (newResponsible.getId().equals(persistedUser.getId())) {
          throw new IllegalStateException("Le remplaçant doit être un autre membre.");
        }
        if (!isUserResponsible(team, newResponsible)) {
          if (team.getPrimaryResponsible() == null) {
            team.setPrimaryResponsible(newResponsible);
          } else if (team.getSecondaryResponsible() == null) {
            team.setSecondaryResponsible(newResponsible);
          }
        }
      }

      removeResponsibleRole(team, persistedUser.getId());
      normalizeResponsibleSlots(team);

      if (countResponsibles(team) == 0 && !team.getMembers().isEmpty()) {
        throw new IllegalStateException("L'équipe doit garder au moins un responsable.");
      }
    }

    team.getMembers().removeIf(member -> member.getId().equals(persistedUser.getId()));
    persistedUser.setTeam(null);
    playerSelectionCleanupService.removeMemberFromFutureSelections(persistedUser.getId());

    userRepository.save(persistedUser);
    teamRepository.save(team);
  }

  /**
   * Updates the profile image of a team.
   *
   * @param teamId the unique identifier of the team.
   * @param imageName the name or URL of the new image.
   * @param currentUser the authenticated user.
   * @throws IllegalArgumentException if team is not found.
   * @throws IllegalStateException if user is not responsible.
   */
  @Transactional
  public void updateTeamImage(Long teamId, String imageName, User currentUser) {
    Team team =
        teamRepository
            .findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found."));

    User persistedUser = loadPersistedUser(currentUser);

    if (!isUserResponsible(team, persistedUser)) {
      throw new IllegalStateException("Seul un responsable peut modifier l'image de l'équipe.");
    }

    team.setProfileImage(imageName);
    teamRepository.save(team);
  }

  /**
   * Internal method to ensure a team is found for the user.
   *
   * @param currentUser the user to check.
   * @return the team associated with the user.
   */
  private Team requireCurrentUserTeam(User currentUser) {
    return resolveCurrentUserTeam(currentUser);
  }

  /**
   * Logic to resolve which team the user currently belongs to.
   *
   * @param currentUser the user to check.
   * @return the resolved team.
   * @throws IllegalStateException if no team is found.
   */
  private Team resolveCurrentUserTeam(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Ce membre n'appartient à aucune équipe.");
    }

    if (currentUser.getTeam() != null) {
      return currentUser.getTeam();
    }

    for (Team team : teamRepository.findAll()) {
      boolean isMember =
          team.getMembers().stream().anyMatch(member -> member.getId().equals(currentUser.getId()));

      if (isMember || isUserResponsible(team, currentUser)) {
        return team;
      }
    }

    throw new IllegalStateException("Ce membre n'appartient à aucune équipe.");
  }

  /**
   * Verifies that the current user is a responsible for the given team.
   *
   * @param team the team to verify.
   * @param currentUser the user to check.
   * @throws IllegalStateException if the user is not a responsible.
   */
  private void verifyCurrentUserIsResponsible(Team team, User currentUser) {
    if (!isUserResponsible(team, currentUser)) {
      throw new IllegalStateException("Seul un responsable peut gérer les responsables.");
    }
  }

  /**
   * Finds a specific member within a team.
   *
   * @param team the team to search.
   * @param memberId the ID of the member to find.
   * @return the found member.
   * @throws IllegalStateException if member is not in the team.
   */
  private User findMemberInTeam(Team team, Long memberId) {
    return team.getMembers().stream()
        .filter(member -> member.getId().equals(memberId))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("The member does not belong to the team."));
  }

  /**
   * Loads the user from the database to ensure data freshness.
   *
   * @param currentUser the current user DTO or entity.
   * @return the persisted user.
   * @throws IllegalStateException if user is not found.
   */
  private User loadPersistedUser(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Ce membre n'appartient à aucune équipe.");
    }

    return userRepository
        .findById(currentUser.getId())
        .orElseThrow(() -> new IllegalStateException("The member does not belong to any team."));
  }

  /**
   * Counts how many responsibles are currently set for a team.
   *
   * @param team the team to check.
   * @return the count (0, 1, or 2).
   */
  private int countResponsibles(Team team) {
    int count = 0;
    if (team.getPrimaryResponsible() != null) {
      count++;
    }
    if (team.getSecondaryResponsible() != null) {
      count++;
    }
    return count;
  }

  /**
   * Internal helper to nullify a responsible slot based on user ID.
   *
   * @param team the team to modify.
   * @param userId the ID of the user to remove.
   */
  private void removeResponsibleRole(Team team, Long userId) {
    if (team.getPrimaryResponsible() != null
        && team.getPrimaryResponsible().getId().equals(userId)) {
      team.setPrimaryResponsible(null);
    }
    if (team.getSecondaryResponsible() != null
        && team.getSecondaryResponsible().getId().equals(userId)) {
      team.setSecondaryResponsible(null);
    }
  }

  /**
   * Ensures the primary responsible slot is filled before the secondary.
   *
   * @param team the team to normalize.
   */
  private void normalizeResponsibleSlots(Team team) {
    boolean hasPrimary = team.getPrimaryResponsible() != null;
    boolean hasSecondary = team.getSecondaryResponsible() != null;

    if (!hasPrimary && hasSecondary) {
      team.setPrimaryResponsible(team.getSecondaryResponsible());
      team.setSecondaryResponsible(null);
    }
  }
}
