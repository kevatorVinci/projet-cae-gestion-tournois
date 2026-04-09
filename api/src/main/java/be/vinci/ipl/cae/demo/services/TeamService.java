package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing the business logic related to teams.
 *
 * <p>
 * This class encapsulates all possible operations on teams: creating a team
 * (with name uniqueness check), retrieving all teams, and retrieving a
 * team by its identifier.
 *
 * <p>
 * The service does not contain any direct database logic: it delegates to the
 * repository, making it easy to test via Mockito.
 */
@Service
public class TeamService {

  private final TeamRepository equipeRepository;
  private final UserRepository userRepository;
  private final DemandService demandService;
  private final NotificationService notificationService;

  /**
   * Constructor injecting the repositories and services.
   *
   * @param equipeRepository    the repository to access persisted data
   * @param userRepository      the user repository
   * @param demandService       the demand service
   * @param notificationService the notification service
   */
  public TeamService(
      TeamRepository equipeRepository,
      UserRepository userRepository,
      DemandService demandService,
      NotificationService notificationService) {
    this.equipeRepository = equipeRepository;
    this.userRepository = userRepository;
    this.demandService = demandService;
    this.notificationService = notificationService;
  }

  /**
   * Retrieves all existing teams.
   *
   * @return an Iterable containing all teams
   */
  public Iterable<Team> getAllEquipes() {
    return equipeRepository.findAll();
  }

  /**
   * Retrieves only active teams (those with at least 1 member). Ideal for
   * display on the "Teams" page of the frontend, to hide empty teams.
   *
   * @return an Iterable containing the active teams
   */
  public Iterable<Team> getEquipesActives() {
    return equipeRepository.findByMembresIsNotEmpty();
  }

  /**
   * Retrieves a team by its identifier.
   *
   * @param id the team identifier
   * @return an Optional containing the team if it exists
   */
  public Optional<Team> getEquipeById(Long id) {
    return equipeRepository.findById(id);
  }

  /**
   * Allows a user to create a team and become primary responsible.
   *
   * @param user         the creator
   * @param nomEquipe    team name
   * @param profileImage the team profile image
   * @return created team or null when name already exists
   */
  public Team createTeam(User user, String nomEquipe, String profileImage) {
    if (user.getEquipe() != null) {
      throw new IllegalStateException("Le membre appartient deja a une equipe.");
    }

    if (equipeRepository.existsByName(nomEquipe)) {
      return null;
    }

    User userPersisted = userRepository.save(user);

    Team equipe = new Team();
    equipe.setName(nomEquipe);
    equipe.setProfileImage(profileImage);
    equipe.setResponsablePrincipal(userPersisted);
    equipe.getMembres().add(userPersisted);

    Team savedTeam = equipeRepository.save(equipe);
    notificationService.notifyTeamCreation(userPersisted, savedTeam.getName());
    userPersisted.setEquipe(savedTeam);
    userRepository.save(userPersisted);

    return savedTeam;
  }

  /**
   * Allows a user to request joining an existing team. Creates a join demand
   * instead of directly
   * adding user to team.
   *
   * @param user     user requesting to join
   * @param equipeId target team id
   */
  public void requestJoinTeam(User user, Long equipeId) {
    demandService.createJoinRequest(user.getId(), equipeId);
  }

  /**
   * Checks whether the given user is one of the team responsibles.
   *
   * @param equipe team to inspect
   * @param user   user to check
   * @return true when user is primary or secondary responsible
   */
  public boolean isUserResponsible(Team equipe, User user) {
    if (equipe == null || user == null) {
      return false;
    }

    Long userId = user.getId();
    boolean isPrincipal = equipe.getResponsablePrincipal() != null
        && equipe.getResponsablePrincipal().getId().equals(userId);

    boolean isSecondaire = equipe.getResponsableSecondaire() != null
        && equipe.getResponsableSecondaire().getId().equals(userId);

    return isPrincipal || isSecondaire;
  }

  /**
   * Checks whether the current user is responsible in their resolved team.
   *
   * @param currentUser authenticated user
   * @return true when the user is responsible of their team
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
   * Promote a team member to responsible role.
   *
   * @param currentUser acting user (must already be responsible)
   * @param membreId    target member to promote
   */
  @Transactional
  public void promoteTeamMember(User currentUser, Long membreId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team equipe = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(equipe, persistedCurrentUser);

    User membre = findMemberInTeam(equipe, membreId);
    if (isUserResponsible(equipe, membre)) {
      throw new IllegalStateException("Ce membre est deja responsable.");
    }

    if (equipe.getResponsablePrincipal() == null) {
      equipe.setResponsablePrincipal(membre);
    } else if (equipe.getResponsableSecondaire() == null) {
      equipe.setResponsableSecondaire(membre);
    } else {
      throw new IllegalStateException("L'equipe a deja le max de responsables.");
    }

    equipeRepository.save(equipe);
  }

  /**
   * Demote a responsible to a regular member while preserving at least one
   * responsible.
   *
   * @param currentUser acting user (must already be responsible)
   * @param membreId    target responsible to demote
   */
  @Transactional
  public void demoteTeamLeader(User currentUser, Long membreId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Team equipe = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(equipe, persistedCurrentUser);

    User membre = findMemberInTeam(equipe, membreId);
    if (!isUserResponsible(equipe, membre)) {
      throw new IllegalStateException(
          "Ce membre n'est pas responsable.");
    }

    if (countResponsables(equipe) <= 1) {
      throw new IllegalStateException(
          "Impossible de depromouvoir le dernier responsable.");
    }

    removeResponsibleRole(equipe, membre.getId());
    normalizeResponsibleSlots(equipe);
    equipeRepository.save(equipe);
  }

  /**
   * Removes a user from their current team.
   *
   * @param user                 persisted user that wants to leave the team
   * @param nouveauResponsableId optional member id to promote when delegation is
   *                             needed
   */
  @Transactional
  public void leaveTeam(User user, Long nouveauResponsableId) {
    User persistedUser = userRepository.findById(user.getId())
        .orElseThrow(() -> new IllegalStateException(
            "Le membre n'appartient a aucune equipe."));

    Team equipe = resolveCurrentUserTeam(persistedUser);

    boolean isResponsible = isUserResponsible(equipe, persistedUser);
    List<User> membres = equipe.getMembres();

    if (isResponsible && membres.size() == 1) {
      equipe.getMembres().clear();

      persistedUser.setEquipe(null);
      equipe.setResponsablePrincipal(null);
      equipe.setResponsableSecondaire(null);

      userRepository.save(persistedUser);
      equipeRepository.save(equipe);
      return;
    }

    if (isResponsible) {
      boolean seulResponsable = countResponsables(equipe) == 1;
      if (seulResponsable) {
        if (nouveauResponsableId == null) {
          throw new IllegalStateException(
              "Vous devez designer un remplaçant avant de quitter l'equipe.");
        }

        User nouveauResponsable = findMemberInTeam(equipe, nouveauResponsableId);
        if (nouveauResponsable.getId().equals(persistedUser.getId())) {
          throw new IllegalStateException("Le remplaçant doit etre un autre membre.");
        }
        if (!isUserResponsible(equipe, nouveauResponsable)) {
          if (equipe.getResponsablePrincipal() == null) {
            equipe.setResponsablePrincipal(nouveauResponsable);
          } else if (equipe.getResponsableSecondaire() == null) {
            equipe.setResponsableSecondaire(nouveauResponsable);
          }
        }
      }

      removeResponsibleRole(equipe, persistedUser.getId());
      normalizeResponsibleSlots(equipe);

      if (countResponsables(equipe) == 0 && !equipe.getMembres().isEmpty()) {
        throw new IllegalStateException("L'equipe doit garder au moins un responsable.");
      }
    }

    equipe.getMembres().removeIf(member -> member.getId().equals(persistedUser.getId()));
    persistedUser.setEquipe(null);

    userRepository.save(persistedUser);
    equipeRepository.save(equipe);
  }

  /**
   * Updates the profile image of a team.
   * Only a responsible member of the team can perform this action.
   *
   * @param equipeId    the ID of the team
   * @param imageName   the new image file name
   * @param currentUser the user requesting the change
   * @throws IllegalArgumentException if the team is not found
   * @throws IllegalStateException    if the user is not a responsible member of
   *                                  the team
   */
  @Transactional
  public void updateEquipeImage(Long equipeId, String imageName, User currentUser) {
    Team equipe = equipeRepository.findById(equipeId)
        .orElseThrow(() -> new IllegalArgumentException("Équipe introuvable."));

    User persistedUser = loadPersistedUser(currentUser);

    if (!isUserResponsible(equipe, persistedUser)) {
      throw new IllegalStateException(
          "Seul un responsable peut modifier l'image de l'équipe.");
    }

    equipe.setProfileImage(imageName);
    equipeRepository.save(equipe);
  }

  private Team requireCurrentUserTeam(User currentUser) {
    return resolveCurrentUserTeam(currentUser);
  }

  private Team resolveCurrentUserTeam(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
    }

    if (currentUser.getEquipe() != null) {
      return currentUser.getEquipe();
    }

    for (Team equipe : equipeRepository.findAll()) {
      boolean isMember = equipe.getMembres().stream()
          .anyMatch(member -> member.getId().equals(currentUser.getId()));

      if (isMember || isUserResponsible(equipe, currentUser)) {
        return equipe;
      }
    }

    throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
  }

  private void verifyCurrentUserIsResponsible(Team equipe, User currentUser) {
    if (!isUserResponsible(equipe, currentUser)) {
      throw new IllegalStateException("Seul un responsable peut gerer les responsables.");
    }
  }

  private User findMemberInTeam(Team equipe, Long membreId) {
    return equipe.getMembres().stream()
        .filter(membre -> membre.getId().equals(membreId))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException(
            "Le membre n'appartient pas a l'equipe."));
  }

  private User loadPersistedUser(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
    }

    return userRepository.findById(currentUser.getId())
        .orElseThrow(() -> new IllegalStateException(
            "Le membre n'appartient a aucune equipe."));
  }

  private int countResponsables(Team equipe) {
    int count = 0;
    if (equipe.getResponsablePrincipal() != null) {
      count++;
    }
    if (equipe.getResponsableSecondaire() != null) {
      count++;
    }
    return count;
  }

  private void removeResponsibleRole(Team equipe, Long userId) {
    if (equipe.getResponsablePrincipal() != null
        && equipe.getResponsablePrincipal().getId().equals(userId)) {
      equipe.setResponsablePrincipal(null);
    }
    if (equipe.getResponsableSecondaire() != null
        && equipe.getResponsableSecondaire().getId().equals(userId)) {
      equipe.setResponsableSecondaire(null);
    }
  }

  private void normalizeResponsibleSlots(Team equipe) {
    boolean hasPrincipal = equipe.getResponsablePrincipal() != null;
    boolean hasSecondaire = equipe.getResponsableSecondaire() != null;

    if (!hasPrincipal && hasSecondaire) {
      equipe.setResponsablePrincipal(equipe.getResponsableSecondaire());
      equipe.setResponsableSecondaire(null);
    }
  }
}
