package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service gérant la logique métier liée aux équipes.
 *
 * <p>
 * Cette classe encapsule toutes les opérations possibles sur les équipes : -
 * création d'une
 * équipe (avec vérification d'unicité du nom) - récupération de toutes les
 * équipes - récupération
 * d'une équipe par son identifiant
 *
 * <p>
 * Le service ne contient aucune logique liée à la base de données directement :
 * il délègue au
 * repository, ce qui permet de le tester facilement via Mockito.
 */
@Service
public class EquipeService {

  private final EquipeRepository equipeRepository;
  private final UserRepository userRepository;
  private final DemandeService demandService;
  private final NotificationService notificationService;

  /**
   * Constructeur injectant les repositories et services.
   *
   * @param equipeRepository le repository permettant d'accéder aux données
   *                         persistées
   * @param userRepository   the user repository
   * @param demandService    the demand service
   */
  public EquipeService(
      EquipeRepository equipeRepository,
      UserRepository userRepository,
      DemandeService demandService,
      NotificationService notificationService) {
    this.equipeRepository = equipeRepository;
    this.userRepository = userRepository;
    this.demandService = demandService;
    this.notificationService = notificationService;
  }

  /**
   * Récupère toutes les équipes existantes.
   *
   * @return un Iterable contenant toutes les équipes
   */
  public Iterable<Equipe> getAllEquipes() {
    return equipeRepository.findAll();
  }

  /**
   * Récupère uniquement les équipes actives (celles qui ont au moins 1 membre).
   * Idéal pour
   * l'affichage sur la page "Teams" du frontend, pour cacher les coquilles vides.
   *
   * @return un Iterable contenant les équipes actives
   */
  public Iterable<Equipe> getEquipesActives() {
    return equipeRepository.findByMembresIsNotEmpty();
  }

  /**
   * Récupère une équipe via son identifiant.
   *
   * @param id l'identifiant de l'équipe
   * @return un Optional contenant l'équipe si elle existe
   */
  public Optional<Equipe> getEquipeById(Long id) {
    return equipeRepository.findById(id);
  }

  /**
   * Allows a user to create a team and become primary responsible.
   *
   * @param user      the creator
   * @param nomEquipe team name
   * @return created team or null when name already exists
   */
  public Equipe creerEquipe(User user, String nomEquipe) {
    if (user.getEquipe() != null) {
      throw new IllegalStateException("Le membre appartient deja a une equipe.");
    }

    if (equipeRepository.existsByName(nomEquipe)) {
      return null;
    }

    User userPersisted = userRepository.save(user);

    Equipe equipe = new Equipe();
    equipe.setName(nomEquipe);
    equipe.setResponsablePrincipal(userPersisted);
    equipe.getMembres().add(userPersisted);

    Equipe savedTeam = equipeRepository.save(equipe);
    notificationService.notifierCreationEquipe(userPersisted, savedTeam.getName());
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
  public void demanderRejoindreEquipe(User user, Long equipeId) {
    // Use the demand service to create a join request
    demandService.creerDemande(user.getId(), equipeId);
  }

  /**
   * Checks whether the given user is one of the team responsibles.
   *
   * @param equipe team to inspect
   * @param user   user to check
   * @return true when user is primary or secondary responsible
   */
  public boolean isUserResponsible(Equipe equipe, User user) {
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
  public void promouvoirResponsable(User currentUser, Long membreId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Equipe equipe = requireCurrentUserTeam(persistedCurrentUser);
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
      throw new IllegalStateException("L'equipe a deja le nombre maximum de responsables.");
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
  public void depromouvoirResponsable(User currentUser, Long membreId) {
    User persistedCurrentUser = loadPersistedUser(currentUser);
    Equipe equipe = requireCurrentUserTeam(persistedCurrentUser);
    verifyCurrentUserIsResponsible(equipe, persistedCurrentUser);

    User membre = findMemberInTeam(equipe, membreId);
    if (!isUserResponsible(equipe, membre)) {
      throw new IllegalStateException("Ce membre n'est pas responsable.");
    }

    if (countResponsables(equipe) <= 1) {
      throw new IllegalStateException("Impossible de depromouvoir le dernier responsable.");
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
  public void quitterEquipe(User user, Long nouveauResponsableId) {
    User persistedUser = userRepository
        .findById(user.getId())
        .orElseThrow(
            () -> new IllegalStateException("Le membre n'appartient a aucune equipe."));

    Equipe equipe = resolveCurrentUserTeam(persistedUser);

    boolean isResponsible = isUserResponsible(equipe, persistedUser);
    List<User> membres = equipe.getMembres();

    // If the responsible is the only member, leaving dissolves the team.
    if (isResponsible && membres.size() == 1) {
      equipe.getMembres().clear(); // 🧹 On vide la liste côté équipe !

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
              "Vous devez designer un autre membre responsable avant de quitter l'equipe.");
        }

        User nouveauResponsable = findMemberInTeam(equipe, nouveauResponsableId);
        if (nouveauResponsable.getId().equals(persistedUser.getId())) {
          throw new IllegalStateException("Le nouveau responsable doit etre un autre membre.");
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
        throw new IllegalStateException("L'equipe doit toujours avoir au moins un responsable.");
      }
    }

    equipe.getMembres().removeIf(member -> member.getId().equals(persistedUser.getId()));
    persistedUser.setEquipe(null);

    userRepository.save(persistedUser);
    equipeRepository.save(equipe);
  }

  private Equipe requireCurrentUserTeam(User currentUser) {
    return resolveCurrentUserTeam(currentUser);
  }

  private Equipe resolveCurrentUserTeam(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
    }

    if (currentUser.getEquipe() != null) {
      return currentUser.getEquipe();
    }

    for (Equipe equipe : equipeRepository.findAll()) {
      boolean isMember = equipe.getMembres().stream()
          .anyMatch(member -> member.getId().equals(currentUser.getId()));
      if (isMember || isUserResponsible(equipe, currentUser)) {
        return equipe;
      }
    }

    throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
  }

  private void verifyCurrentUserIsResponsible(Equipe equipe, User currentUser) {
    if (!isUserResponsible(equipe, currentUser)) {
      throw new IllegalStateException("Seul un responsable peut gerer les responsables.");
    }
  }

  private User findMemberInTeam(Equipe equipe, Long membreId) {
    return equipe.getMembres().stream()
        .filter(membre -> membre.getId().equals(membreId))
        .findFirst()
        .orElseThrow(
            () -> new IllegalStateException("Le membre cible n'appartient pas a l'equipe."));
  }

  private User loadPersistedUser(User currentUser) {
    if (currentUser == null || currentUser.getId() == null) {
      throw new IllegalStateException("Le membre n'appartient a aucune equipe.");
    }

    return userRepository
        .findById(currentUser.getId())
        .orElseThrow(() -> new IllegalStateException("Le membre n'appartient a aucune equipe."));
  }

  private int countResponsables(Equipe equipe) {
    int count = 0;
    if (equipe.getResponsablePrincipal() != null) {
      count++;
    }
    if (equipe.getResponsableSecondaire() != null) {
      count++;
    }
    return count;
  }

  private void removeResponsibleRole(Equipe equipe, Long userId) {
    if (equipe.getResponsablePrincipal() != null
        && equipe.getResponsablePrincipal().getId().equals(userId)) {
      equipe.setResponsablePrincipal(null);
    }
    if (equipe.getResponsableSecondaire() != null
        && equipe.getResponsableSecondaire().getId().equals(userId)) {
      equipe.setResponsableSecondaire(null);
    }
  }

  private void normalizeResponsibleSlots(Equipe equipe) {
    if (equipe.getResponsablePrincipal() == null && equipe.getResponsableSecondaire() != null) {
      equipe.setResponsablePrincipal(equipe.getResponsableSecondaire());
      equipe.setResponsableSecondaire(null);
    }
  }
}