package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.Membre;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.MembreRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Service gérant la logique métier liée aux membres. - création d'une équipe par un membre -
 * demande de rejoindre une équipe - vérification des règles métier (un membre = une seule équipe).
 */
@Service
public class MembreService {

  private final MembreRepository membreRepository;
  private final EquipeRepository equipeRepository;

  public MembreService(MembreRepository membreRepository, EquipeRepository equipeRepository) {
    this.membreRepository = membreRepository;
    this.equipeRepository = equipeRepository;
  }

  /**
   * Récupère un membre par son identifiant.
   *
   * @param id identifiant du membre
   * @return Optional contenant le membre s'il existe
   */
  public Optional<Membre> getById(Long id) {
    return membreRepository.findById(id);
  }

  /**
   * Permet à un membre de créer une nouvelle équipe. Le membre devient automatiquement responsable
   * principal.
   *
   * @param membre    le membre créateur
   * @param nomEquipe le nom choisi pour l'équipe
   * @return l'équipe créée, ou null si le nom est déjà pris
   */
  public Equipe creerEquipe(Membre membre, String nomEquipe) {

    // Le membre ne peut pas déjà appartenir à une équipe
    if (membre.getEquipe() != null) {
      throw new IllegalStateException("Le membre appartient déjà à une équipe.");
    }

    // Le nom doit être unique
    if (equipeRepository.existsByName(nomEquipe)) {
      return null;
    }

    // Sauvegarder le membre s'il n'est pas encore persisté
    Membre membrePersiste = membreRepository.save(membre);

    // Créer l'équipe
    Equipe equipe = new Equipe();
    equipe.setName(nomEquipe);
    equipe.setResponsablePrincipal(membrePersiste);
    equipe.getMembres().add(membrePersiste);

    // Sauvegarder l'équipe
    Equipe equipeSauvee = equipeRepository.save(equipe);

    // Mettre à jour le membre avec son équipe
    membrePersiste.setEquipe(equipeSauvee);
    membreRepository.save(membrePersiste);

    return equipeSauvee;
  }

  /**
   * Permet à un membre de demander à rejoindre une équipe existante. (Pour l'instant, la demande
   * est acceptée automatiquement.)
   *
   * @param membre   le membre qui souhaite rejoindre
   * @param equipeId l'identifiant de l'équipe ciblée
   */
  public void demanderRejoindreEquipe(Membre membre, Long equipeId) {

    // Le membre ne peut pas déjà appartenir à une équipe
    if (membre.getEquipe() != null) {
      throw new IllegalStateException("Le membre appartient déjà à une équipe.");
    }

    // Vérifier que l'équipe existe
    Equipe equipe = equipeRepository.findById(equipeId)
        .orElseThrow(() -> new IllegalArgumentException("Équipe introuvable."));

    // Ajouter le membre à l'équipe
    equipe.getMembres().add(membre);
    membre.setEquipe(equipe);

    // Sauvegardes
    equipeRepository.save(equipe);
    membreRepository.save(membre);
  }
}
