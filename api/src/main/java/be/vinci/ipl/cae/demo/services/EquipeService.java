package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Service gérant la logique métier liée aux équipes.
 *
 * <p>Cette classe encapsule toutes les opérations possibles sur les équipes : - création d'une
 * équipe (avec vérification d'unicité du nom) - récupération de toutes les équipes - récupération
 * d'une équipe par son identifiant
 *
 * <p>Le service ne contient aucune logique liée à la base de données directement : il délègue au
 * repository, ce qui permet de le tester facilement via Mockito.
 */
@Service
public class EquipeService {

  private final EquipeRepository equipeRepository;
  private final UserRepository userRepository;
  private final DemandeService demandService;

  /**
   * Constructeur injectant les repositories et services.
   *
   * @param equipeRepository le repository permettant d'accéder aux données persistées
   * @param userRepository the user repository
   * @param demandService the demand service
   */
  public EquipeService(EquipeRepository equipeRepository, UserRepository userRepository,
      DemandeService demandService) {
    this.equipeRepository = equipeRepository;
    this.userRepository = userRepository;
    this.demandService = demandService;
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
    userPersisted.setEquipe(savedTeam);
    userRepository.save(userPersisted);

    return savedTeam;
  }

  /**
   * Allows a user to request joining an existing team. Creates a join demand instead of directly
   * adding user to team.
   *
   * @param user     user requesting to join
   * @param equipeId target team id
   */
  public void demanderRejoindreEquipe(User user, Long equipeId) {
    // Use the demand service to create a join request
    demandService.creerDemande(user.getId(), equipeId);
  }
}
