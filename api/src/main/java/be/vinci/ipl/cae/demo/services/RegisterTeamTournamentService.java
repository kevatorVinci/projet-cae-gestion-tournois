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
  private final TournamentRepository tournamentRepository;
  private final TeamRepository teamRepository;
  private final TournamentService tournamentService;
  private final NotificationService notificationService;

  /**
   * Creates the service with its repositories and tournament service dependency.
   */
  public RegisterTeamTournamentService(
          InscriptionEquipeTournoiRepository inscriptionRepository,
          TournamentRepository tournamentRepository,
          TeamRepository teamRepository,
          TournamentService tournamentService,
          NotificationService notificationService) {
    this.inscriptionRepository = inscriptionRepository;
    this.tournamentRepository = tournamentRepository;
    this.teamRepository = teamRepository;
    this.tournamentService = tournamentService;
    this.notificationService = notificationService;
  }

  /**
   * Gets all registrations for a given tournament.
   */
  public Iterable<RegistrationTeamTournament> getAllByTournoi(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    if (tournament == null) {
      return null;
    }
    return inscriptionRepository.findByTournoi(tournament); // Uses existing DB method
  }

  /**
   * Gets all registrations for a specific team.
   */
  public Iterable<RegistrationTeamTournament> getAllByEquipe(Long teamId) {
    Team team = teamRepository.findById(teamId).orElse(null);
    if (team == null) {
      return null;
    }
    return inscriptionRepository.findByEquipe(team); // Uses existing DB method
  }

  /**
   * Registers a team in a tournament.
   * Registration is immediate and final when the tournament is OUVERT.
   *
   * @param tournamentId tournament ID
   * @param teamId  team ID
   * @return created registration, or null if action is not allowed
   */
  public RegistrationTeamTournament register(Long tournamentId, Long teamId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    if (tournament == null || !"OUVERT".equals(tournament.getStatus())) {
      return null; // Tournament does not exist or is no longer open for registrations
    }

    Team team = teamRepository.findById(teamId).orElse(null);
    if (team == null) {
      return null;
    }

    if (team.getMembres() == null
            || team.getMembres().size() < MIN_MEMBERS_FOR_REGISTRATION) {
      throw new IllegalArgumentException(
              "Une équipe doit avoir au moins 4 membres pour s'inscrire à un tournoi.");
    }

    // Block when the team is already registered
    if (inscriptionRepository.findByTournoiAndEquipe(tournament, team).isPresent()) {
      return null;
    }

    // Create the registration using the English setters
    RegistrationTeamTournament registration = new RegistrationTeamTournament();
    registration.setTournament(tournament);
    registration.setTeam(team);
    registration.setRegistrationDate(LocalDate.now());

    RegistrationTeamTournament saved = inscriptionRepository.save(registration);

    String message = "Équipe : inscription confirmée pour votre équipe '"
            + team.getName()
            + "' est inscrite au tournoi '"
            + tournament.getName()
            + "'.";
    for (var member : team.getMembres()) {
      notificationService.createNotification(member, message);
    }

    // Automatic closure when tournament reaches capacity
    if (tournament.getMaxParticipants() != null) {
      Collection<?> registered = (Collection<?>) inscriptionRepository.findByTournoi(tournament);
      if (registered.size() >= tournament.getMaxParticipants()) {
        tournamentService.closeRegistrations(tournament.getId()); // Tournament moves to CLOTURE
      }
    }

    return saved;
  }

  /**
   * Unregisters a team from a tournament (deletes the registration row).
   * Allowed only while the tournament is still OUVERT and before the deadline.
   *
   * @param registrationId registration ID to delete
   * @return true if unregistration succeeded, false otherwise
   */
  public boolean unregister(Long registrationId) {
    RegistrationTeamTournament registration = inscriptionRepository
            .findById(registrationId)
            .orElse(null);
    if (registration == null) {
      return false;
    }

    Tournament tournament = registration.getTournament();
    if (!isUnregisterAllowed(tournament, true)) {
      return false;
    }

    // Clean unregistration: physically delete the row
    inscriptionRepository.delete(registration);

    return true;
  }

  /**
   * Unregisters a team from a tournament using the logical key (tournamentId, teamId).
   * Allowed only while the tournament is still OUVERT and before the deadline.
   */
  public boolean unregisterByTournoiAndEquipe(Long tournamentId, Long teamId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    Team team = teamRepository.findById(teamId).orElse(null);
    if (tournament == null || team == null) {
      return false;
    }

    RegistrationTeamTournament registration = inscriptionRepository
            .findByTournoiAndEquipe(tournament, team)
            .orElse(null);
    if (registration == null) {
      return false;
    }

    if (!isUnregisterAllowed(tournament, false)) {
      return false;
    }

    inscriptionRepository.delete(registration);

    return true;
  }

  /**
   * Gets a registration by its ID.
   */
  public RegistrationTeamTournament getById(Long registrationId) {
    return inscriptionRepository.findById(registrationId).orElse(null);
  }

  /**
   * Validates whether a tournament still allows unregister operations.
   *
   * @param tournament tournament to validate
   * @param logIfDeadlinePassed true to log a message when deadline is passed
   * @return true if unregister is allowed, false otherwise
   */
  private boolean isUnregisterAllowed(Tournament tournament, boolean logIfDeadlinePassed) {
    if (!"OUVERT".equals(tournament.getStatus())) {
      return false;
    }

    if (tournament.getRegistrationDeadline() != null
            && tournament.getRegistrationDeadline().isBefore(LocalDate.now())) {
      if (logIfDeadlinePassed) {
        System.out.println("Unregistration denied: tournament deadline has passed.");
      }
      return false;
    }

    return true;
  }
}