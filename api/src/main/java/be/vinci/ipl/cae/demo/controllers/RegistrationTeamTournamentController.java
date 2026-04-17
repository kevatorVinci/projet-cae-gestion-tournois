package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.annotations.IsAdminOrResponsable;
import be.vinci.ipl.cae.demo.annotations.IsResponsable;
import be.vinci.ipl.cae.demo.mappers.RegisterTeamTournamentMapper;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TeamTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentTeamRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.RegisterTeamTournamentService;
import be.vinci.ipl.cae.demo.services.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller handling team registrations to tournaments.
 */
@RestController
@RequestMapping("/tournois")
public class RegistrationTeamTournamentController {

  private final RegisterTeamTournamentService registrationService;
  private final TeamService teamService;
  private final RegisterTeamTournamentMapper registrationMapper;

  /**
   * Creates the controller with required services.
   *
   * @param registrationService the registration service.
   * @param teamService         the team service.
   * @param registrationMapper  the mapper for registrations.
   */
  public RegistrationTeamTournamentController(
          RegisterTeamTournamentService registrationService,
          TeamService teamService,
          RegisterTeamTournamentMapper registrationMapper) {
    this.registrationService = registrationService;
    this.teamService = teamService;
    this.registrationMapper = registrationMapper;
  }

  /**
   * Helper to fetch registrations and handle 404 for tournaments.
   *
   * @param tournamentId the tournament ID.
   * @return the list of registrations.
   */
  private Iterable<RegistrationTeamTournament> fetchTournamentRegistrations(Long tournamentId) {
    Iterable<RegistrationTeamTournament> registrations =
            registrationService.getAllByTournament(tournamentId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return registrations;
  }

  /**
   * Helper to fetch registrations and handle 404 for teams.
   *
   * @param teamId the team ID.
   * @return the list of registrations.
   */
  private Iterable<RegistrationTeamTournament> fetchTeamRegistrations(Long teamId) {
    Iterable<RegistrationTeamTournament> registrations =
            registrationService.getAllByTeam(teamId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return registrations;
  }

  /**
   * Returns all registrations for a tournament. Admin only.
   *
   * @param tournamentId the ID of the tournament.
   * @return a list of registrations.
   */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<RegistrationTeamTournament> getAllByTournament(
          @PathVariable("tournoiId") Long tournamentId) {
    return fetchTournamentRegistrations(tournamentId);
  }

  /**
   * Returns publicly visible registrations for the tournament details page.
   *
   * @param tournamentId the ID of the tournament.
   * @return a list of DTOs for accepted registrations.
   */
  @GetMapping("/{tournoiId}/inscriptions/accepted")
  public Iterable<TournamentTeamRegistrationDto> getAcceptedByTournament(
          @PathVariable("tournoiId") Long tournamentId) {
    return registrationMapper.toTournoiEquipeInscriptionDtos(
            fetchTournamentRegistrations(tournamentId));
  }

  /**
   * Returns all registrations for one team. Accessible to responsible users or admins.
   *
   * @param teamId      the ID of the team.
   * @param currentUser the current logged-in user.
   * @return a list of DTOs.
   */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<TeamTournamentRegistrationDto> getAllByTeam(
          @PathVariable("equipeId") Long teamId,
          @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
            teamId, currentUser, "You can only view your own team registrations");
    return registrationMapper.toEquipeTournamentRegistrationDtos(
            fetchTeamRegistrations(teamId));
  }

  /**
   * Returns publicly visible registrations for one team (player profile view).
   *
   * @param teamId the ID of the team.
   * @return a list of registrations.
   */
  @GetMapping("/equipes/{equipeId}/inscriptions/public")
  public Iterable<TeamTournamentRegistrationDto> getPublicByTeam(
          @PathVariable("equipeId") Long teamId) {
    return registrationMapper.toEquipeTournamentRegistrationDtos(
            fetchTeamRegistrations(teamId));
  }

  /**
   * Registers a team for a tournament. Reserved for the team's responsible user.
   *
   * @param tournamentId the ID of the tournament.
   * @param teamId       the ID of the team.
   * @param currentUser  the current user.
   * @return the created registration.
   */
  @PostMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @ResponseStatus(HttpStatus.CREATED)
  @IsResponsable
  public RegistrationTeamTournament register(
          @PathVariable("tournoiId") Long tournamentId,
          @PathVariable("equipeId") Long teamId,
          @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
            teamId, currentUser, "You can only register your own team");
    RegistrationTeamTournament registration;
    try {
      registration = registrationService.register(tournamentId, teamId);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
    }
    if (registration == null) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Tournament not found, not OUVERT, or team already registered");
    }
    return registration;
  }

  /**
   * Unregisters a team from a tournament using the logical key.
   *
   * <p>This endpoint is currently not used by the frontend application.
   *
   * @param tournamentId the ID of the tournament.
   * @param teamId       the ID of the team.
   * @param currentUser  the current user.
   */
  @DeleteMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @IsAdminOrResponsable
  public void unregisterByTournamentAndTeam(
          @PathVariable("tournoiId") Long tournamentId,
          @PathVariable("equipeId") Long teamId,
          @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "A responsible cannot unregister a team from a tournament");
    }

    ensureCurrentUserResponsibleForTeam(
            teamId, currentUser, "You can only unregister your own team");

    boolean success = registrationService.unregisterByTournamentAndTeam(tournamentId, teamId);
    if (!success) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Registration not found, tournament not OUVERT, or deadline passed");
    }
  }

  /**
   * Unregisters a team from a tournament using the registration ID.
   *
   * <p>This endpoint is currently not used by the frontend application.
   *
   * @param registrationId the ID of the registration.
   * @param currentUser    the current user.
   */
  @DeleteMapping("/inscriptions/{inscriptionId}")
  @IsAdminOrResponsable
  public void unregister(
          @PathVariable("inscriptionId") Long registrationId,
          @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "A responsible cannot unregister a team from a tournament");
    }
    boolean success = registrationService.unregister(registrationId);
    if (!success) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Registration not found, tournament not OUVERT, or deadline passed");
    }
  }

  private void ensureCurrentUserResponsibleForTeam(
          Long teamId, User currentUser, String forbiddenMessage) {
    if (currentUser.isAdmin()) {
      return;
    }
    Team team = teamService.getTeamById(teamId).orElse(null);
    if (team == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    if (!teamService.isUserResponsible(team, currentUser)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
    }
  }
}