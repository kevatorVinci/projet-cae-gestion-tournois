package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.util.Optional;
import java.util.stream.StreamSupport;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

/** Service managing all business logic related to tournaments. */
@Service
public class TournoiService {

  private final TournoiRepository tournoiRepository;
  private final InscriptionEquipeTournoiService inscriptionService; // ← ajout

  /**
   * Constructs a TournoiService with the given repository.
   *
   * @param tournoiRepository the tournament repository
   */
  public TournoiService(
      TournoiRepository tournoiRepository,
      @Lazy InscriptionEquipeTournoiService inscriptionService) {
    this.tournoiRepository = tournoiRepository;
    this.inscriptionService = inscriptionService;
  }

  /**
   * Retrieves all publicly visible tournaments (all states except BROUILLON). Used for the visitor
   * and member home pages (US 2 & 3).
   *
   * @return all tournaments visible to the public
   */
  public Iterable<Tournoi> getAllPublic() {
    return StreamSupport.stream(tournoiRepository.findAll().spliterator(), false)
        .filter(t -> !"BROUILLON".equals(t.getEtat()))
        .toList();
  }

  /**
   * Retrieves all tournaments regardless of state. Reserved for administrators.
   *
   * @return all tournaments
   */
  public Iterable<Tournoi> getAll() {
    return tournoiRepository.findAll();
  }

  /**
   * Retrieves a single tournament by its id.
   *
   * @param id the tournament id
   * @return the tournament if found, empty otherwise
   */
  public Optional<Tournoi> getOne(Long id) {
    return tournoiRepository.findById(id);
  }

  /**
   * Creates a new tournament in BROUILLON state. The name must be unique across all tournaments (US
   * 7).
   *
   * @param tournoi the tournament to create
   * @return the saved tournament, or null if the name is already taken
   */
  public Tournoi create(Tournoi tournoi) {
    if (tournoiRepository.findByNom(tournoi.getNom()).isPresent()) {
      return null;
    }
    tournoi.setEtat("BROUILLON");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Updates a tournament. Only allowed when the tournament is in BROUILLON state (Could US 15).
   *
   * @param id the tournament id
   * @param payload the fields to update
   * @return the updated tournament, or null if not found or not in BROUILLON state
   */
  public Tournoi update(Long id, Tournoi payload) {
    Tournoi existing = tournoiRepository.findById(id).orElse(null);
    if (existing == null) {
      return null;
    }
    if (!"BROUILLON".equals(existing.getEtat())) {
      return null;
    }
    if (payload.getNom() != null) {
      existing.setNom(payload.getNom());
    }
    if (payload.getDescription() != null) {
      existing.setDescription(payload.getDescription());
    }
    if (payload.getDateDebut() != null) {
      existing.setDateDebut(payload.getDateDebut());
    }
    if (payload.getDateFin() != null) {
      existing.setDateFin(payload.getDateFin());
    }
    if (payload.getDateLimiteInscription() != null) {
      existing.setDateLimiteInscription(payload.getDateLimiteInscription());
    }
    if (payload.getNombresParticipantsMax() != null) {
      existing.setNombresParticipantsMax(payload.getNombresParticipantsMax());
    }
    return tournoiRepository.save(existing);
  }

  /**
   * Publishes a tournament, making it visible to the public (BROUILLON → OUVERT). Should US 9.
   *
   * @param id the tournament id
   * @return the updated tournament, or null if not found or not in BROUILLON state
   */
  public Tournoi publish(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if (!"BROUILLON".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("OUVERT");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Closes registrations for a tournament (OUVERT → CLOTURE). No new teams can register after this
   * point. Should US 10.
   *
   * @param id the tournament id
   * @return the updated tournament, or null if not found or not in OUVERT state
   */
  public Tournoi closeRegistrations(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if (!"OUVERT".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("CLOTURE");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Starts a tournament (CLOTURE → EN_COURS). All registrations still in EN_ATTENTE are
   * automatically refused.
   *
   * @param id the tournament id
   * @return the updated tournament, or null if not found or not in CLOTURE state
   */
  public Tournoi start(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if (!"CLOTURE".equals(tournoi.getEtat())) {
      return null;
    }

    inscriptionService.refuseAllPending(tournoi); // ← utilise la méthode

    tournoi.setEtat("EN_COURS");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Marks a tournament as finished (EN_COURS → TERMINE).
   *
   * @param id the tournament id
   * @return the updated tournament, or null if not found or not in EN_COURS state
   */
  public Tournoi finish(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if (!"EN_COURS".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("TERMINE");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Cancels a tournament from any active state (→ ANNULE). A tournament can be cancelled unless it
   * is already TERMINE or ANNULE.
   *
   * @param id the tournament id
   * @return the updated tournament, or null if not found or already TERMINE/ANNULE
   */
  public Tournoi cancel(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if ("TERMINE".equals(tournoi.getEtat()) || "ANNULE".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("ANNULE");
    return tournoiRepository.save(tournoi);
  }
}
