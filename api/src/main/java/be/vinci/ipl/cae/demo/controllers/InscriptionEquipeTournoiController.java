package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.annotations.IsAdminOrResponsable;
import be.vinci.ipl.cae.demo.annotations.IsResponsable;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import be.vinci.ipl.cae.demo.services.InscriptionEquipeTournoiService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Controller managing team registration endpoints for tournaments. */
@RestController
@RequestMapping("/tournois")
public class InscriptionEquipeTournoiController {

  private final InscriptionEquipeTournoiService inscriptionService;
  private final EquipeService equipeService;

  /**
   * Constructs an InscriptionEquipeTournoiController with the given service.
   *
   * @param inscriptionService the inscription service
   * @param equipeService the equipe service
   */
  public InscriptionEquipeTournoiController(
      InscriptionEquipeTournoiService inscriptionService, EquipeService equipeService) {
    this.inscriptionService = inscriptionService;
    this.equipeService = equipeService;
  }

  /** Returns all registrations for a tournament. Reserved for admins. */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<InscriptionEquipeTournoi> getAllByTournoi(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions = inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Returns only accepted registrations for a tournament. Accessible by authenticated users. */
  @GetMapping("/{tournoiId}/inscriptions/accepted")
  @PreAuthorize("isAuthenticated()")
  public Iterable<InscriptionEquipeTournoi> getAccepted(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions =
        inscriptionService.getAcceptedByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Returns only pending registrations for a tournament. Reserved for admins. */
  @GetMapping("/{tournoiId}/inscriptions/pending")
  @IsAdmin
  public Iterable<InscriptionEquipeTournoi> getPending(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions =
        inscriptionService.getPendingByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Returns only refused registrations for a tournament. Reserved for admins. */
  @GetMapping("/{tournoiId}/inscriptions/refused")
  @IsAdmin
  public Iterable<InscriptionEquipeTournoi> getRefused(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions =
        inscriptionService.getRefusedByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Returns all registrations for a team. Accessible by the team's responsible or an admin. */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<InscriptionEquipeTournoi> getAllByEquipe(
      @PathVariable Long equipeId, @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
        equipeId, currentUser, "You can only view your own team registrations");
    Iterable<InscriptionEquipeTournoi> inscriptions = inscriptionService.getAllByEquipe(equipeId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return inscriptions;
  }

  /**
   * Registers a team for a tournament (→ EN_ATTENTE). Only the responsible of the team can register
   * it.
   */
  @PostMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @ResponseStatus(HttpStatus.CREATED)
  @IsResponsable
  public InscriptionEquipeTournoi register(
      @PathVariable Long tournoiId,
      @PathVariable Long equipeId,
      @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
      equipeId, currentUser, "You can only register your own team");

    InscriptionEquipeTournoi inscription = inscriptionService.register(tournoiId, equipeId);
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found, not OUVERT, or team already registered");
    }
    return inscription;
  }

  /** Validates a registration (EN_ATTENTE → VALIDEE). Reserved for admins. */
  @PatchMapping("/inscriptions/{inscriptionId}/validate")
  @IsAdmin
  public InscriptionEquipeTournoi validate(@PathVariable Long inscriptionId) {
    InscriptionEquipeTournoi inscription = inscriptionService.validate(inscriptionId);
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Registration not found or not in EN_ATTENTE state");
    }
    return inscription;
  }

  /** Refuses a registration (EN_ATTENTE → REFUSEE). Reserved for admins. */
  @PatchMapping("/inscriptions/{inscriptionId}/refuse")
  @IsAdmin
  public InscriptionEquipeTournoi refuse(@PathVariable Long inscriptionId) {
    InscriptionEquipeTournoi inscription = inscriptionService.refuse(inscriptionId);
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Registration not found or not in EN_ATTENTE state");
    }
    return inscription;
  }

  /**
   * Cancels a validated registration (VALIDEE → ANNULEE). A responsable can only cancel their own
   * team's registration.
   */
  @PatchMapping("/inscriptions/{inscriptionId}/cancel")
  @IsAdminOrResponsable
  public InscriptionEquipeTournoi cancel(
      @PathVariable Long inscriptionId, @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      InscriptionEquipeTournoi existing = inscriptionService.getById(inscriptionId);
      if (existing == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registration not found");
      }
      if (!equipeService.isUserResponsible(existing.getEquipe(), currentUser)) {
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN, "You can only cancel your own team's registration");
      }
    }
    InscriptionEquipeTournoi inscription = inscriptionService.cancel(inscriptionId);
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Registration not found, not VALIDEE, or tournament already started");
    }
    return inscription;
  }

  /** Reopens a refused registration (REFUSEE → EN_ATTENTE). Reserved for admins. */
  @PatchMapping("/inscriptions/{inscriptionId}/reopen")
  @IsAdmin
  public InscriptionEquipeTournoi reopen(@PathVariable Long inscriptionId) {
    InscriptionEquipeTournoi inscription = inscriptionService.reopen(inscriptionId);
    if (inscription == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Registration not found or not in REFUSEE state");
    }
    return inscription;
  }

  private void ensureCurrentUserResponsibleForTeam(
      Long equipeId, User currentUser, String forbiddenMessage) {
    if (currentUser.isAdmin()) {
      return;
    }

    Equipe equipe = equipeService.getEquipeById(equipeId).orElse(null);
    if (equipe == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    if (!equipeService.isUserResponsible(equipe, currentUser)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
    }
  }
}
