package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.time.LocalDate;
import java.util.Collection;
import org.springframework.stereotype.Service;

/** Service managing all business logic related to team registrations for tournaments. */
@Service
public class InscriptionEquipeTournoiService {

  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final TournoiRepository tournoiRepository;
  private final EquipeRepository equipeRepository;
  private final TournoiService tournoiService;

  /** Creates the service with its repositories and tournament service dependency. */
  public InscriptionEquipeTournoiService(
          InscriptionEquipeTournoiRepository inscriptionRepository,
          TournoiRepository tournoiRepository,
          EquipeRepository equipeRepository,
          TournoiService tournoiService) {
    this.inscriptionRepository = inscriptionRepository;
    this.tournoiRepository = tournoiRepository;
    this.equipeRepository = equipeRepository;
    this.tournoiService = tournoiService;
  }

  /**
   * Récupère toutes les inscriptions pour un tournoi donné.
   */
  public Iterable<InscriptionEquipeTournoi> getAllByTournoi(Long tournoiId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoi(tournoi);
  }

  /**
   * Récupère toutes les inscriptions d'une équipe spécifique.
   */
  public Iterable<InscriptionEquipeTournoi> getAllByEquipe(Long equipeId) {
    Equipe equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }
    return inscriptionRepository.findByEquipe(equipe);
  }

  /**
   * Inscrit une équipe à un tournoi.
   * L'inscription est directe et définitive si le tournoi est OUVERT.
   *
   * @param tournoiId l'ID du tournoi
   * @param equipeId l'ID de l'équipe
   * @return l'inscription créée, ou null si l'action est interdite
   */
  public InscriptionEquipeTournoi register(Long tournoiId, Long equipeId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null || !"OUVERT".equals(tournoi.getEtat())) {
      return null; // Le tournoi n'existe pas ou n'est plus ouvert aux inscriptions
    }

    Equipe equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }

    // On bloque si l'équipe est déjà inscrite
    if (inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe).isPresent()) {
      return null;
    }

    // On crée l'inscription
    InscriptionEquipeTournoi inscription = new InscriptionEquipeTournoi();
    inscription.setTournoi(tournoi);
    inscription.setEquipe(equipe);
    inscription.setDateInscription(LocalDate.now());

    // (Note: Si ton entité InscriptionEquipeTournoi possède encore le champ 'etat',
    // tu devrais le supprimer du fichier InscriptionEquipeTournoi.java)

    InscriptionEquipeTournoi saved = inscriptionRepository.save(inscription);

    // ── Clôture automatique si le tournoi est plein ──
    if (tournoi.getNombresParticipantsMax() != null) {
      Collection<?> inscrits = (Collection<?>) inscriptionRepository.findByTournoi(tournoi);
      if (inscrits.size() >= tournoi.getNombresParticipantsMax()) {
        tournoiService.closeRegistrations(tournoi.getId()); // Le tournoi passe en CLOTURE
      }
    }

    return saved;
  }

  /**
   * Désinscrit une équipe d'un tournoi (supprime l'inscription en base de données).
   * Autorisé uniquement quand le tournoi est encore OUVERT et avant la date limite.
   *
   * @param inscriptionId l'ID de l'inscription à supprimer
   * @return true si la désinscription a réussi, false sinon
   */
  public boolean unregister(Long inscriptionId) {
    InscriptionEquipeTournoi inscription =
            inscriptionRepository.findById(inscriptionId).orElse(null);
    if (inscription == null) {
      return false;
    }

    Tournoi tournoi = inscription.getTournoi();
    if (!isUnregisterAllowed(tournoi, true)) {
      return false;
    }

    // 3. Désinscription propre : on supprime physiquement la ligne
    inscriptionRepository.delete(inscription);

    return true;
  }

  /**
   * Désinscrit une équipe d'un tournoi via la clé logique (tournoiId, equipeId).
   * Autorisé uniquement quand le tournoi est encore OUVERT et avant la date limite.
   */
  public boolean unregisterByTournoiAndEquipe(Long tournoiId, Long equipeId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    Equipe equipe = equipeRepository.findById(equipeId).orElse(null);
    if (tournoi == null || equipe == null) {
      return false;
    }

    InscriptionEquipeTournoi inscription =
            inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe).orElse(null);
    if (inscription == null) {
      return false;
    }

    if (!isUnregisterAllowed(tournoi, false)) {
      return false;
    }

    inscriptionRepository.delete(inscription);

    return true;
  }

  /**
   * Récupère une inscription par son ID.
   */
  public InscriptionEquipeTournoi getById(Long inscriptionId) {
    return inscriptionRepository.findById(inscriptionId).orElse(null);
  }

  /**
   * Validates whether a tournament still allows unregister operations.
   *
   * @param tournoi tournament to validate
   * @param logIfDeadlinePassed true to log a message when deadline is passed
   * @return true if unregister is allowed, false otherwise
   */
  private boolean isUnregisterAllowed(Tournoi tournoi, boolean logIfDeadlinePassed) {
    if (!"OUVERT".equals(tournoi.getEtat())) {
      return false;
    }

    if (tournoi.getDateLimiteInscription() != null
        && tournoi.getDateLimiteInscription().isBefore(LocalDate.now())) {
      if (logIfDeadlinePassed) {
        System.out.println("❌ Désinscription refusée : La date limite du tournoi est dépassée.");
      }
      return false;
    }

    return true;
  }
}