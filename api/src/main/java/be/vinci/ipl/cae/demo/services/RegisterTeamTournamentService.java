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
 * Service managing all business logic related to team registrations for tournaments.
 */
@Service
public class RegisterTeamTournamentService {

  private static final int MIN_MEMBERS_FOR_REGISTRATION = 4;

  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final TournamentRepository tournamentRepository;
  private final TeamRepository teamRepository;
  private final TournamentService tournamentService;
  private final NotificationService notificationService;

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

  public Iterable<RegistrationTeamTournament> getAllByTournament(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId).orElse(null);
    if (tournament == null) {
      return null;
    }
    return inscriptionRepository.findByTournament(tournament);
  }

  public Iterable<RegistrationTeamTournament> getAllByTeam(Long teamId) {
    Team team = teamRepository.findById(teamId).orElse(null);
    if (team == null) {
      return null;
    }
    return inscriptionRepository.findByTeam(team);
  }

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

    inscriptionRepository.delete(registration);

    return true;
  }

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

    if (!isUnregisterAllowed(tournament, false)) {
      return false;
    }

    inscriptionRepository.delete(registration);

    return true;
  }

  public RegistrationTeamTournament getById(Long registrationId) {
    return inscriptionRepository.findById(registrationId).orElse(null);
  }

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