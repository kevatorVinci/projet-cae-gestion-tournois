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
   * Possible uniquement si le tournoi n'a pas encore commencé.
   *
   * @param inscriptionId l'ID de l'inscription à supprimer
   * @return true si la désinscription a réussi, false sinon
   */
  /**
   * Désinscrit une équipe d'un tournoi (supprime l'inscription en base de données).
   * Rouvre automatiquement le tournoi si une place se libère et que la date n'est pas dépassée.
   */
  /**
   * Désinscrit une équipe d'un tournoi (supprime l'inscription en base de données).
   * Interdit si le tournoi a commencé OU si la date limite d'inscription est dépassée.
   * Rouvre automatiquement le tournoi si une place se libère.
   */
  public boolean unregister(Long inscriptionId) {
    InscriptionEquipeTournoi inscription = inscriptionRepository.findById(inscriptionId).orElse(null);
    if (inscription == null) {
      return false;
    }

    Tournoi tournoi = inscription.getTournoi();
    String etatTournoi = tournoi.getEtat();

    // 1. On interdit si le tournoi est en train de se jouer ou est terminé
    if ("EN_COURS".equals(etatTournoi) || "TERMINE".equals(etatTournoi) || "ANNULE".equals(etatTournoi)) {
      return false;
    }

    // 2. 🚨 NOUVELLE SÉCURITÉ : On interdit si la date limite est dépassée
    if (tournoi.getDateLimiteInscription() != null &&
            tournoi.getDateLimiteInscription().isBefore(LocalDate.now())) {
      System.out.println("❌ Désinscription refusée : La date limite du tournoi est dépassée.");
      return false; // Trop tard pour fuir !
    }

    // 3. Désinscription propre : on supprime physiquement la ligne
    inscriptionRepository.delete(inscription);

    // 4. Logique de réouverture automatique
    // Si on arrive ici, on sait avec certitude que la date n'est PAS dépassée
    // (sinon le code se serait arrêté juste au-dessus).
    // Donc si le tournoi était CLOTURE, c'était forcément parce qu'il était plein !
    if ("CLOTURE".equals(etatTournoi)) {
      tournoi.setEtat("OUVERT");
      tournoiRepository.save(tournoi);
      System.out.println("🔓 Une place s'est libérée, le tournoi " + tournoi.getNom() + " est de nouveau OUVERT !");
    }

    return true;
  }

  /**
   * Récupère une inscription par son ID.
   */
  public InscriptionEquipeTournoi getById(Long inscriptionId) {
    return inscriptionRepository.findById(inscriptionId).orElse(null);
  }
}