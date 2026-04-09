package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDate;
import java.util.Collection;
import org.springframework.stereotype.Service;

/**
 * Service managing all business logic related to team registrations for
 * tournaments.
 */
@Service
public class RegisterTeamTournamentService {

  private static final int MIN_MEMBERS_FOR_REGISTRATION = 4;

  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final TournamentRepository tournoiRepository;
  private final TeamRepository equipeRepository;
  private final TournamentService tournoiService;
  private final NotificationService notificationService;

  /**
   * Creates the service with its repositories and tournament service dependency.
   */
  public RegisterTeamTournamentService(
      InscriptionEquipeTournoiRepository inscriptionRepository,
      TournamentRepository tournoiRepository,
      TeamRepository equipeRepository,
      TournamentService tournoiService,
      NotificationService notificationService) {
    this.inscriptionRepository = inscriptionRepository;
    this.tournoiRepository = tournoiRepository;
    this.equipeRepository = equipeRepository;
    this.tournoiService = tournoiService;
    this.notificationService = notificationService;
  }

  /**
   * Gets all registrations for a given tournament.
   */
  public Iterable<RegistrationTeamTournament> getAllByTournoi(Long tournoiId) {
    Tournament tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null) {
      return null;
    }
    return inscriptionRepository.findByTournoi(tournoi);
  }

  /**
   * Gets all registrations for a specific team.
   */
  public Iterable<RegistrationTeamTournament> getAllByEquipe(Long equipeId) {
    Team equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }
    return inscriptionRepository.findByEquipe(equipe);
  }

  /**
   * Registers a team in a tournament.
   * Registration is immediate and final when the tournament is OUVERT.
   *
   * @param tournoiId tournament ID
   * @param equipeId  team ID
   * @return created registration, or null if action is not allowed
   */
  public RegistrationTeamTournament register(Long tournoiId, Long equipeId) {
    Tournament tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    if (tournoi == null || !"OUVERT".equals(tournoi.getEtat())) {
      return null; // Tournament does not exist or is no longer open for registrations
    }

    Team equipe = equipeRepository.findById(equipeId).orElse(null);
    if (equipe == null) {
      return null;
    }

    if (equipe.getMembres() == null
        || equipe.getMembres().size() < MIN_MEMBERS_FOR_REGISTRATION) {
      throw new IllegalArgumentException(
          "Une équipe doit avoir au moins 4 membres pour s'inscrire à un tournoi.");
    }

    // Block when the team is already registered
    if (inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe).isPresent()) {
      return null;
    }

    // Create the registration
    RegistrationTeamTournament inscription = new RegistrationTeamTournament();
    inscription.setTournoi(tournoi);
    inscription.setEquipe(equipe);
    inscription.setDateInscription(LocalDate.now());

    // (Note: If InscriptionEquipeTournoi still has an 'etat' field,
    // remove it from InscriptionEquipeTournoi.java)

    RegistrationTeamTournament saved = inscriptionRepository.save(inscription);

    String message = "Équipe : inscription confirmée pour votre équipe '"
        + equipe.getName()
        + "' est inscrite au tournoi '"
        + tournoi.getNom()
        + "'.";
    for (var membre : equipe.getMembres()) {
      notificationService.createNotification(membre, message);
    }

    // Automatic closure when tournament reaches capacity
    if (tournoi.getNombresParticipantsMax() != null) {
      Collection<?> inscrits = (Collection<?>) inscriptionRepository.findByTournoi(tournoi);
      if (inscrits.size() >= tournoi.getNombresParticipantsMax()) {
        tournoiService.closeRegistrations(tournoi.getId()); // Tournament moves to CLOTURE
      }
    }

    return saved;
  }

  /**
   * Unregisters a team from a tournament (deletes the registration row).
   * Allowed only while the tournament is still OUVERT and before the deadline.
   *
   * @param inscriptionId registration ID to delete
   * @return true if unregistration succeeded, false otherwise
   */
  public boolean unregister(Long inscriptionId) {
    RegistrationTeamTournament inscription = inscriptionRepository.findById(inscriptionId).orElse(null);
    if (inscription == null) {
      return false;
    }

    Tournament tournoi = inscription.getTournoi();
    if (!isUnregisterAllowed(tournoi, true)) {
      return false;
    }

    // Clean unregistration: physically delete the row
    inscriptionRepository.delete(inscription);

    return true;
  }

  /**
   * Unregisters a team from a tournament using the logical key (tournoiId,
   * equipeId).
   * Allowed only while the tournament is still OUVERT and before the deadline.
   */
  public boolean unregisterByTournoiAndEquipe(Long tournoiId, Long equipeId) {
    Tournament tournoi = tournoiRepository.findById(tournoiId).orElse(null);
    Team equipe = equipeRepository.findById(equipeId).orElse(null);
    if (tournoi == null || equipe == null) {
      return false;
    }

    RegistrationTeamTournament inscription = inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe).orElse(null);
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
   * Gets a registration by its ID.
   */
  public RegistrationTeamTournament getById(Long inscriptionId) {
    return inscriptionRepository.findById(inscriptionId).orElse(null);
  }

  /**
   * Validates whether a tournament still allows unregister operations.
   *
   * @param tournoi             tournament to validate
   * @param logIfDeadlinePassed true to log a message when deadline is passed
   * @return true if unregister is allowed, false otherwise
   */
  private boolean isUnregisterAllowed(Tournament tournoi, boolean logIfDeadlinePassed) {
    if (!"OUVERT".equals(tournoi.getEtat())) {
      return false;
    }

    if (tournoi.getDateLimiteInscription() != null
        && tournoi.getDateLimiteInscription().isBefore(LocalDate.now())) {
      if (logIfDeadlinePassed) {
        System.out.println("Unregistration denied: tournament deadline has passed.");
      }
      return false;
    }

    return true;
  }
}