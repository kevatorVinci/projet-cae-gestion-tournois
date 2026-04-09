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

/** Controller handling team registrations to tournaments. */
@RestController
@RequestMapping("/tournois")
public class RegistrationTeamTournamentController {

  private final RegisterTeamTournamentService inscriptionService;
  private final TeamService equipeService;
  private final RegisterTeamTournamentMapper inscriptionMapper;

  /** Creates the controller with required services. */
  public RegistrationTeamTournamentController(
      RegisterTeamTournamentService inscriptionService,
      TeamService equipeService,
      RegisterTeamTournamentMapper inscriptionMapper) {
    this.inscriptionService = inscriptionService;
    this.equipeService = equipeService;
    this.inscriptionMapper = inscriptionMapper;
  }

  /** Returns all registrations for a tournament. Admin only. */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<RegistrationTeamTournament> getAllByTournoi(@PathVariable Long tournoiId) {
    Iterable<RegistrationTeamTournament> inscriptions = inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Returns publicly visible registrations for the tournament details page. */
  @GetMapping("/{tournoiId}/inscriptions/accepted")
  public Iterable<TournamentTeamRegistrationDto> getAcceptedByTournoi(
      @PathVariable Long tournoiId) {
    Iterable<RegistrationTeamTournament> inscriptions = inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptionMapper.toTournoiEquipeInscriptionDtos(inscriptions);
  }

  /**
   * Returns all registrations for one team. Accessible to responsible users or
   * admins.
   */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<TeamTournamentRegistrationDto> getAllByEquipe(
      @PathVariable Long equipeId, @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
        equipeId, currentUser, "You can only view your own team registrations");
    Iterable<RegistrationTeamTournament> inscriptions = inscriptionService.getAllByEquipe(equipeId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return inscriptionMapper.toEquipeTournamentRegistrationDtos(inscriptions);
  }

  /**
   * Returns publicly visible registrations for one team (player profile view).
   */
  @GetMapping("/equipes/{equipeId}/inscriptions/public")
  public Iterable<TeamTournamentRegistrationDto> getPublicByEquipe(
      @PathVariable Long equipeId) {
    Iterable<RegistrationTeamTournament> inscriptions = inscriptionService.getAllByEquipe(equipeId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return inscriptionMapper.toEquipeTournamentRegistrationDtos(inscriptions);
  }

  /**
   * Registers a team for a tournament. Reserved for the team's responsible user.
   */
  @PostMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @ResponseStatus(HttpStatus.CREATED)
  @IsResponsable
  public RegistrationTeamTournament register(
      @PathVariable Long tournoiId,
      @PathVariable Long equipeId,
      @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
        equipeId, currentUser, "You can only register your own team");
    RegistrationTeamTournament inscription;
    try {
      inscription = inscriptionService.register(tournoiId, equipeId);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
    }
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Tournament not found, not OUVERT, or team already registered");
    }
    return inscription;
  }

  /**
   * Unregisters a team from a tournament using the logical key (tournoiId,
   * equipeId).
   *
   * <p>
   * This endpoint is currently not used by the frontend application.
   */
  @DeleteMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @IsAdminOrResponsable
  public void unregisterByTournoiAndEquipe(
      @PathVariable Long tournoiId,
      @PathVariable Long equipeId,
      @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "A responsible cannot unregister a team from a tournament");
    }

    ensureCurrentUserResponsibleForTeam(
        equipeId, currentUser, "You can only unregister your own team");

    boolean success = inscriptionService.unregisterByTournoiAndEquipe(tournoiId, equipeId);
    if (!success) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Registration not found, tournament is not OUVERT, or registration deadline passed");
    }
  }

  /**
   * Unregisters a team from a tournament using the registration ID.
   *
   * <p>
   * This endpoint is currently not used by the frontend application.
   */
  @DeleteMapping("/inscriptions/{inscriptionId}")
  @IsAdminOrResponsable
  public void unregister(
      @PathVariable Long inscriptionId, @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "A responsible cannot unregister a team from a tournament");
    }
    boolean success = inscriptionService.unregister(inscriptionId);
    if (!success) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Registration not found, tournament is not OUVERT, or registration deadline passed");
    }
  }

  private void ensureCurrentUserResponsibleForTeam(
      Long equipeId, User currentUser, String forbiddenMessage) {
    if (currentUser.isAdmin()) {
      return;
    }
    Team equipe = equipeService.getEquipeById(equipeId).orElse(null);
    if (equipe == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    if (!equipeService.isUserResponsible(equipe, currentUser)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
    }
  }
}
