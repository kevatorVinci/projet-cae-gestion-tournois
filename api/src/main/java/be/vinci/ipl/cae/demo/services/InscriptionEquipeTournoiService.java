package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

/** Service managing all business logic related to team registrations for tournaments. */
@Service
public class InscriptionEquipeTournoiService {

  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final TournoiRepository tournoiRepository;
  private final EquipeRepository equipeRepository;
  private final TournoiService tournoiService; // ← ajout pour réutiliser closeRegistrations

  /**
   * Constructs an InscriptionEquipeTournoiService with the required repositories.
   *
   * @param inscriptionRepository the inscription repository
   * @param tournoiRepository the tournament repository
   * @param equipeRepository the team repository
   * @param tournoiService the tournament service
   */
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
   * Retrieves all registrations for a given tournament.
   *
   * @param tournoiId the tournament id
   * @return all registrations for that tournament, or null if tournament not found
   */
  public Iterable<InscriptionEquipeTournoi> getAllByTournoi(Long tournoiId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoi(tournoi);
  }

  /**
   * Retrieves only validated (accepted) registrations for a given tournament.
   *
   * @param tournoiId the tournament id
   * @return validated registrations, or null if tournament not found
   */
  public Iterable<InscriptionEquipeTournoi> getAcceptedByTournoi(Long tournoiId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoiAndEtat(tournoi, "VALIDEE");
  }

  /**
   * Retrieves all registrations for a given team.
   *
   * @param equipeId the team id
   * @return all registrations for that team, or null if team not found
   */
  public Iterable<InscriptionEquipeTournoi> getAllByEquipe(Long equipeId) {
    Equipe equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }
    return inscriptionRepository.findByEquipe(equipe);
  }

  /**
   * Retrieves one registration by id.
   *
   * @param inscriptionId the registration id
   * @return the registration, or null if not found
   */
  public InscriptionEquipeTournoi getById(Long inscriptionId) {
    return inscriptionRepository.findById(inscriptionId).orElse(null);
  }

  /**
   * Retrieves only pending registrations (EN_ATTENTE) for a given tournament.
   *
   * @param tournoiId the tournament id
   * @return pending registrations, or null if tournament not found
   */
  public Iterable<InscriptionEquipeTournoi> getPendingByTournoi(Long tournoiId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoiAndEtat(tournoi, "EN_ATTENTE");
  }

  /**
   * Retrieves only refused registrations (REFUSEE) for a given tournament.
   *
   * @param tournoiId the tournament id
   * @return refused registrations, or null if tournament not found
   */
  public Iterable<InscriptionEquipeTournoi> getRefusedByTournoi(Long tournoiId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoiAndEtat(tournoi, "REFUSEE");
  }

  /**
   * Registers a team for a tournament (state → EN_ATTENTE). Only allowed if the tournament is in
   * OUVERT state and the team is not already registered.
   *
   * @param tournoiId the tournament id
   * @param equipeId the team id
   * @return the created registration, or null if not allowed
   */
  public InscriptionEquipeTournoi register(Long tournoiId, Long equipeId) {
    Tournoi tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    if (!"OUVERT".equals(tournoi.getEtat())) {
      return null;
    }

    Equipe equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }

    if (inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe).isPresent()) {
      return null;
    }

    InscriptionEquipeTournoi inscription = new InscriptionEquipeTournoi();
    inscription.setTournoi(tournoi);
    inscription.setEquipe(equipe);
    inscription.setDateInscription(LocalDate.now());
    inscription.setEtat("EN_ATTENTE");
    return inscriptionRepository.save(inscription);
  }

  /**
   * Validates a registration (EN_ATTENTE → VALIDEE). If the max number of participants is reached
   * after validation, registrations are automatically closed using TournoiService.
   *
   * @param inscriptionId the registration id
   * @return the updated registration, or null if not found or not in EN_ATTENTE state
   */
  public InscriptionEquipeTournoi validate(Long inscriptionId) {
    InscriptionEquipeTournoi inscription = getInscriptionInState(inscriptionId, "EN_ATTENTE");
    if (inscription == null) {
      return null;
    }

    inscription.setEtat("VALIDEE");
    InscriptionEquipeTournoi saved = inscriptionRepository.save(inscription);

    // ── Clôture automatique si le max d'équipes VALIDEES est atteint ──
    Tournoi tournoi = inscription.getTournoi();
    if (tournoi.getNombresParticipantsMax() != null) {
      long nbValidees = inscriptionRepository.findByTournoiAndEtat(tournoi, "VALIDEE").size();
      if (nbValidees >= tournoi.getNombresParticipantsMax()) {
        tournoiService.closeRegistrations(tournoi.getId()); // ← réutilise la méthode existante
      }
    }
    // ──────────────────────────────────────────────────────────────────

    return saved;
  }

  /**
   * Refuses a registration (EN_ATTENTE → REFUSEE).
   *
   * @param inscriptionId the registration id
   * @return the updated registration, or null if not found or not in EN_ATTENTE state
   */
  public InscriptionEquipeTournoi refuse(Long inscriptionId) {
    InscriptionEquipeTournoi inscription = getInscriptionInState(inscriptionId, "EN_ATTENTE");
    if (inscription == null) {
      return null;
    }

    inscription.setEtat("REFUSEE");
    return inscriptionRepository.save(inscription);
  }

  /**
   * Cancels a validated registration (VALIDEE → ANNULEE). Only allowed if the tournament is not yet
   * started (not EN_COURS or TERMINE).
   *
   * @param inscriptionId the registration id
   * @return the updated registration, or null if not found or cancellation not allowed
   */
  public InscriptionEquipeTournoi cancel(Long inscriptionId) {
    InscriptionEquipeTournoi inscription = getInscriptionInState(inscriptionId, "VALIDEE");
    if (inscription == null) {
      return null;
    }

    if (hasTournamentState(inscription, "EN_COURS", "TERMINE")) {
      return null;
    }

    inscription.setEtat("ANNULEE");
    return inscriptionRepository.save(inscription);
  }

  /**
   * Refuses all registrations still in EN_ATTENTE for a given tournament. Called automatically when
   * a tournament starts.
   *
   * @param tournoi the tournament
   */
  public void refuseAllPending(Tournoi tournoi) {
    List<InscriptionEquipeTournoi> enAttente =
        inscriptionRepository.findByTournoiAndEtat(tournoi, "EN_ATTENTE");
    for (InscriptionEquipeTournoi inscription : enAttente) {
      inscription.setEtat("REFUSEE");
    }
    inscriptionRepository.saveAll(enAttente);
  }

  /**
   * Reopens a refused registration back to EN_ATTENTE (REFUSEE → EN_ATTENTE). Only allowed if the
   * tournament is still OUVERT or CLOTURE.
   *
   * @param inscriptionId the registration id
   * @return the updated registration, or null if not allowed
   */
  public InscriptionEquipeTournoi reopen(Long inscriptionId) {
    InscriptionEquipeTournoi inscription = getInscriptionInState(inscriptionId, "REFUSEE");
    if (inscription == null) {
      return null;
    }

    if (hasTournamentState(inscription, "EN_COURS", "TERMINE", "ANNULE")) {
      return null;
    }

    inscription.setEtat("EN_ATTENTE");
    return inscriptionRepository.save(inscription);
  }

  private InscriptionEquipeTournoi getInscriptionInState(Long inscriptionId, String expectedState) {
    InscriptionEquipeTournoi inscription =
        inscriptionRepository.findById(inscriptionId).orElse(null);
    if (inscription == null) {
      return null;
    }
    if (!expectedState.equals(inscription.getEtat())) {
      return null;
    }
    return inscription;
  }

  private boolean hasTournamentState(InscriptionEquipeTournoi inscription, String... states) {
    String tournamentState = inscription.getTournoi().getEtat();
    for (String state : states) {
      if (state.equals(tournamentState)) {
        return true;
      }
    }
    return false;
  }
}
