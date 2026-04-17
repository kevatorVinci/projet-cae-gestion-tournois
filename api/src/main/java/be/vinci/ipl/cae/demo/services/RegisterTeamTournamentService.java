package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collection;

/**
 * Service managing all business logic related to team registrations for tournaments.
 */
@Service
public class RegisterTeamTournamentService {

  /**
   * Minimum number of members required for a team to register.
   */
  private static final int MIN_MEMBERS_FOR_REGISTRATION = 4;

  /**
   * Repository for managing registration persistence.
   */
  private final InscriptionEquipeTournoiRepository inscriptionRepository;

  /**
   * Repository for managing tournament persistence.
   */
  private final TournamentRepository tournamentRepository;

  /**
   * Repository for managing team persistence.
   */
  private final TeamRepository teamRepository;

  /**
   * Service for tournament-related business logic.
   */
  private final TournamentService tournamentService;

  /**
   * Service for sending notifications to users.
   */
  private final NotificationService notificationService;

  /**
   * Constructor with dependency injection.
   *
   * @param inscriptionRepository the registration repository.
   * @param tournamentRepository  the tournament repository.
   * @param teamRepository        the team repository.
   * @param tournamentService     the tournament service.
   * @param notificationService   the notification service.
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
   * Retrieves all registrations for a specific tournament.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @return an iterable of registrations, or null if tournament is not found.
   */
  public Iterable<RegistrationTeamTournament> getAllByTournament(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    if (tournament == null) {
      return null;
    }
    return inscriptionRepository.findByTournament(tournament);
  }

  /**
   * Retrieves all registrations for a specific team.
   *
   * @param teamId the unique identifier of the team.
   * @return an iterable of registrations, or null if team is not found.
   */
  public Iterable<RegistrationTeamTournament> getAllByTeam(Long teamId) {
    Team team = teamRepository.findById(teamId).orElse(null);
    if (team == null) {
      return null;
    }
    return inscriptionRepository.findByTeam(team);
  }

  /**
   * Registers a team for a tournament if all criteria are met.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @param teamId       the unique identifier of the team.
   * @return the saved registration entity, or null if registration is not possible.
   * @throws IllegalArgumentException if the team has fewer than the required members.
   */
  public RegistrationTeamTournament register(Long tournamentId, Long teamId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    if (tournament == null || !"OUVERT".equals(tournament.getStatus())) {
      return null;
    }

    Team team = teamRepository.findById(teamId).orElse(null);
    if (team == null) {
      return null;
    }

    if (team.getMembers() == null || team.getMembers().size() < MIN_MEMBERS_FOR_REGISTRATION) {
      throw new IllegalArgumentException(
              "A team must have at least 4 members to register for a tournament.");
    }

    if (inscriptionRepository.findByTournamentAndTeam(tournament, team).isPresent()) {
      return null;
    }

    RegistrationTeamTournament registration = new RegistrationTeamTournament();
    registration.setTournament(tournament);
    registration.setTeam(team);
    registration.setRegistrationDate(LocalDate.now());

    RegistrationTeamTournament saved = inscriptionRepository.save(registration);

    String message = "Team: registration confirmed for your team '"
            + team.getName()
            + "' in the tournament '"
            + tournament.getName()
            + "'.";
    for (var member : team.getMembers()) {
      notificationService.createNotification(member, message);
    }

    if (tournament.getMaxParticipants() != null) {
      Collection<?> registered = (Collection<?>) inscriptionRepository.findByTournament(tournament);
      if (registered.size() >= tournament.getMaxParticipants()) {
        tournamentService.closeRegistrations(tournament.getId());
      }
    }

    return saved;
  }

  /**
   * Cancels a registration using its ID.
   *
   * @param registrationId the unique identifier of the registration.
   * @return true if unregistration succeeded, false otherwise.
   */
  public boolean unregister(Long registrationId) {
    RegistrationTeamTournament registration = inscriptionRepository
            .findById(registrationId)
            .orElse(null);
    if (registration == null) {
      return false;
    }

    Tournament tournament = registration.getTournament();
    if (!isUnregisterAllowed(tournament)) {
      return false;
    }

    inscriptionRepository.delete(registration);

    return true;
  }

  /**
   * Cancels a registration for a specific tournament and team.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @param teamId       the unique identifier of the team.
   * @return true if unregistration succeeded, false otherwise.
   */
  public boolean unregisterByTournamentAndTeam(Long tournamentId, Long teamId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    Team team = teamRepository.findById(teamId).orElse(null);
    if (tournament == null || team == null) {
      return false;
    }

    RegistrationTeamTournament registration = inscriptionRepository
            .findByTournamentAndTeam(tournament, team)
            .orElse(null);
    if (registration == null) {
      return false;
    }

    if (!isUnregisterAllowed(tournament)) {
      return false;
    }

    inscriptionRepository.delete(registration);

    return true;
  }

  /**
   * Retrieves a registration by its ID.
   *
   * @param registrationId the unique identifier of the registration.
   * @return the registration entity, or null if not found.
   */
  public RegistrationTeamTournament getById(Long registrationId) {
    return inscriptionRepository.findById(registrationId).orElse(null);
  }

  /**
   * Checks if unregistration is currently permitted for a tournament.
   *
   * @param tournament the tournament entity.
   * @return true if unregistration is allowed, false otherwise.
   */
  private boolean isUnregisterAllowed(Tournament tournament) {
    return "OUVERT".equals(tournament.getStatus())
            && (tournament.getRegistrationDeadline() == null
            || !tournament.getRegistrationDeadline().isBefore(LocalDate.now()));
  }
}