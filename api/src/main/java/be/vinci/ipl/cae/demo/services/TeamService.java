package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service managing the business logic related to teams.
 * <p>
 * This class encapsulates all possible operations on teams: creating a team
 * (with name uniqueness check), retrieving all teams, and retrieving a
 * team by its identifier.
 * </p>
 */
@Service
public class TeamService {

  private final TeamRepository teamRepository;
  private final UserRepository userRepository;
  private final DemandService demandService;
  private final NotificationService notificationService;

  /**
   * Constructor for TeamService.
   */
  public TeamService(
      TeamRepository teamRepository,
      UserRepository userRepository,
      DemandService demandService,
      NotificationService notificationService) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
    this.demandService = demandService;
    this.notificationService = notificationService;
  }

  /**
   * Retrieves all existing teams.
   *
   * @return an Iterable containing all teams
   */
  public Iterable<Team> getAllTeams() {
    return teamRepository.findAll();
  }

  /**
   * Retrieves only active teams (those with at least 1 member).
   *
   * @return an Iterable containing the active teams
   */
  public Iterable<Team> getActiveTeams() {
    return teamRepository.findByMembersIsNotEmpty();
  }

  /**
   * Retrieves a team by its identifier.
   *
   * @param id the team identifier
   * @return an Optional containing the team if it exists
   */
  public Optional<Team> getTeamById(Long id) {
    return teamRepository.findById(id);
  }

  /**
   * Allows a user to create a team and become primary responsible.
   */
  public Team createTeam(User user, String teamName, String profileImage) {
    if (user.getTeam() != null) {
      throw new IllegalStateException("The member already belongs to a team.");
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
   */
  public void requestJoinTeam(User user, Long teamId) {
    demandService.createJoinRequest(user.getId(), teamId);
  }

  /**
   * Checks whether the given user is one of the team responsibles.
   */
  public boolean isUserResponsible(Team team, User user) {
    if (team == null || user == null) {
      return false;
    }

    Long userId = user.getId();
    boolean isPrimary = team.getPrimaryResponsible() != null
        && team.getPrimaryResponsible().getId().equals(userId);

    boolean isSecondary = team.getSecondaryResponsible() != null
        && team.getSecondaryResponsible().getId().equals(userId);

    return isPrimary || isSecondary;
  }

  /**
   * Checks whether the current user is a team leader.
   */
  public boolean isCurrentUserResponsible(User currentUser) {
    try {
      User persistedCurrentUser = loadPersistedUser(currentUser);
      return isUserResponsible(resolveCurrentUserTeam(persistedCurrentUser), persistedCurrentUser);
    } catch (IllegalStateException e) {
      return false;
    }
  }

  /**
   * Promotes a team member to a responsible role.
   */
  @Transactional
  public void promoteTeamMember(User currentUser, Long memberId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team team = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(team, persistedCurrentUser);

    User member = findMemberInTeam(team, memberId);
    if (isUserResponsible(team, member)) {
      throw new IllegalStateException("This member is already responsible.");
    }

    if (team.getPrimaryResponsible() == null) {
      team.setPrimaryResponsible(member);
    } else if (team.getSecondaryResponsible() == null) {
      team.setSecondaryResponsible(member);
    } else {
      throw new IllegalStateException("The team already has the maximum number of responsibles.");
    }

    teamRepository.save(team);
  }

  /**
   * Removes a responsible role from a team member.
   */
  @Transactional
  public void demoteTeamLeader(User currentUser, Long memberId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team team = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(team, persistedCurrentUser);

    User member = findMemberInTeam(team, memberId);
    if (!isUserResponsible(team, member)) {
      throw new IllegalStateException("This member is not responsible.");
    }

    if (countResponsibles(team) <= 1) {
      throw new IllegalStateException("Cannot demote the last responsible.");
    }

    removeResponsibleRole(team, member.getId());
    normalizeResponsibleSlots(team);
    teamRepository.save(team);
  }

  /**
   * Allows a user to leave their team.
   */
  @Transactional
  public void leaveTeam(User user, Long newResponsibleId) {
    User persistedUser = userRepository.findById(user.getId())
        .orElseThrow(() -> new IllegalStateException("The member does not belong to any team."));

    Team team = resolveCurrentUserTeam(persistedUser);

    boolean isResponsible = isUserResponsible(team, persistedUser);
    List<User> members = team.getMembers();

    if (isResponsible && members.size() == 1) {
      team.getMembers().clear();

      persistedUser.setTeam(null);
      team.setPrimaryResponsible(null);
      team.setSecondaryResponsible(null);

      userRepository.save(persistedUser);
      teamRepository.save(team);
      return;
    }

    if (isResponsible) {
      boolean onlyResponsible = countResponsibles(team) == 1;
      if (onlyResponsible) {
        if (newResponsibleId == null) {
          throw new IllegalStateException("You must designate a replacement.");
        }

        User newResponsible = findMemberInTeam(team, newResponsibleId);
        if (newResponsible.getId().equals(persistedUser.getId())) {
          throw new IllegalStateException("The replacement must be another member.");
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
        throw new IllegalStateException("The team must keep at least one responsible.");
      }
    }

    team.getMembers().removeIf(member -> member.getId().equals(persistedUser.getId()));
    persistedUser.setTeam(null);

    userRepository.save(persistedUser);
    teamRepository.save(team);
  }

  /**
   * Updates the profile image of a team.
   */
  @Transactional
  public void updateTeamImage(Long teamId, String imageName, User currentUser) {
    Team team = teamRepository.findById(teamId)
        .orElseThrow(() -> new IllegalArgumentException("Team not found."));

    User persistedUser = loadPersistedUser(currentUser);

    if (!isUserResponsible(team, persistedUser)) {
      throw new IllegalStateException("Only a responsible can modify the team's image.");
    }

    team.setProfileImage(imageName);
    teamRepository.save(team);
  }

  private Team requireCurrentUserTeam(User currentUser) {
    return resolveCurrentUserTeam(currentUser);
  }

  private Team resolveCurrentUserTeam(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("The member does not belong to any team.");
    }

    if (currentUser.getTeam() != null) {
      return currentUser.getTeam();
    }

    for (Team team : teamRepository.findAll()) {
      boolean isMember = team.getMembers().stream()
          .anyMatch(member -> member.getId().equals(currentUser.getId()));

      if (isMember || isUserResponsible(team, currentUser)) {
        return team;
      }
    }

    throw new IllegalStateException("The member does not belong to any team.");
  }

  private void verifyCurrentUserIsResponsible(Team team, User currentUser) {
    if (!isUserResponsible(team, currentUser)) {
      throw new IllegalStateException("Only a responsible can manage the responsibles.");
    }
  }

  private User findMemberInTeam(Team team, Long memberId) {
    return team.getMembers().stream()
        .filter(member -> member.getId().equals(memberId))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("The member does not belong to the team."));
  }

  private User loadPersistedUser(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("The member does not belong to any team.");
    }

    return userRepository.findById(currentUser.getId())
        .orElseThrow(() -> new IllegalStateException("The member does not belong to any team."));
  }

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

  private void normalizeResponsibleSlots(Team team) {
    boolean hasPrimary = team.getPrimaryResponsible() != null;
    boolean hasSecondary = team.getSecondaryResponsible() != null;

    if (!hasPrimary && hasSecondary) {
      team.setPrimaryResponsible(team.getSecondaryResponsible());
      team.setSecondaryResponsible(null);
    }
  }
}