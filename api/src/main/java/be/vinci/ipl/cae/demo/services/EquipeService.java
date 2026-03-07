package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Service gérant la logique métier liée aux équipes.
 * <p>
 * Cette classe encapsule toutes les opérations possibles sur les équipes : - création d'une équipe
 * (avec vérification d'unicité du nom) - récupération de toutes les équipes - récupération d'une
 * équipe par son identifiant
 * <p>
 * Le service ne contient aucune logique liée à la base de données directement : il délègue au
 * repository, ce qui permet de le tester facilement via Mockito.
 */
@Service
public class EquipeService {

  private final EquipeRepository equipeRepository;

  /**
   * Constructeur injectant le repository.
   *
   * @param equipeRepository le repository permettant d'accéder aux données persistées
   */
  public EquipeService(EquipeRepository equipeRepository) {
    this.equipeRepository = equipeRepository;
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
}
