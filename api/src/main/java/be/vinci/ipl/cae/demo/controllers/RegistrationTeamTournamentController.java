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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
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
   * Returns all registrations for a tournament. Admin only.
   */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<RegistrationTeamTournament> getAllByTournament(
    @PathVariable("tournoiId") Long tournamentId) {
    Iterable<RegistrationTeamTournament> registrations =
      registrationService.getAllByTournament(tournamentId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return registrations;
  }

  /**
   * Returns publicly visible registrations for the tournament details page.
   */
  @GetMapping("/{tournoiId}/inscriptions/accepted")
  public Iterable<TournamentTeamRegistrationDto> getAcceptedByTournament(
    @PathVariable("tournoiId") Long tournamentId) {
    Iterable<RegistrationTeamTournament> registrations =
      registrationService.getAllByTournament(tournamentId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return registrationMapper.toTournoiEquipeInscriptionDtos(registrations);
  }

  /**
   * Returns all registrations for one team. Accessible to responsible users or
   * admins.
   */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<TeamTournamentRegistrationDto> getAllByTeam(
    @PathVariable("equipeId") Long teamId, @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
      teamId, currentUser, "You can only view your own team registrations");
    Iterable<RegistrationTeamTournament> registrations =
      registrationService.getAllByTeam(teamId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return registrationMapper.toEquipeTournamentRegistrationDtos(registrations);
  }

  /**
   * Returns publicly visible registrations for one team (player profile view).
   */
  @GetMapping("/equipes/{equipeId}/inscriptions/public")
  public Iterable<TeamTournamentRegistrationDto> getPublicByTeam(
    @PathVariable("equipeId") Long teamId) {
    Iterable<RegistrationTeamTournament> registrations =
      registrationService.getAllByTeam(teamId);
    if (registrations == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return registrationMapper.toEquipeTournamentRegistrationDtos(registrations);
  }

  /**
   * Registers a team for a tournament. Reserved for the team's responsible user.
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
   * Unregisters a team from a tournament using the logical key (tournoiId,
   * equipeId).
   * <p>
   * This endpoint is currently not used by the frontend application.
   */
  @DeleteMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @IsAdminOrResponsable
  public void unregisterByTournamentAndTeam(
    @PathVariable("tournoiId") Long tournamentId,
    @PathVariable("equipeId") Long teamId,
    @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN, "A responsible cannot unregister a team from a tournament");
    }

    ensureCurrentUserResponsibleForTeam(
      teamId, currentUser, "You can only unregister your own team");

    boolean success = registrationService.unregisterByTournamentAndTeam(tournamentId, teamId);
    if (!success) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Registration not found, tournament is not OUVERT, or registration deadline passed");
    }
  }

  /**
   * Unregisters a team from a tournament using the registration ID.
   * <p>
   * This endpoint is currently not used by the frontend application.
   */
  @DeleteMapping("/inscriptions/{inscriptionId}")
  @IsAdminOrResponsable
  public void unregister(
    @PathVariable("inscriptionId") Long registrationId, @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN, "A responsible cannot unregister a team from a tournament");
    }
    boolean success = registrationService.unregister(registrationId);
    if (!success) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Registration not found, tournament is not OUVERT, or registration deadline passed");
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