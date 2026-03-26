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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/tournois")
public class InscriptionEquipeTournoiController {

  private final InscriptionEquipeTournoiService inscriptionService;
  private final EquipeService equipeService;

  public InscriptionEquipeTournoiController(
          InscriptionEquipeTournoiService inscriptionService,
          EquipeService equipeService) {
    this.inscriptionService = inscriptionService;
    this.equipeService = equipeService;
  }

  /** Retourne toutes les inscriptions d'un tournoi. Réservé aux admins. */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<InscriptionEquipeTournoi> getAllByTournoi(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions =
            inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /** Retourne toutes les inscriptions d'une équipe. Accessible au responsable ou à un admin. */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<InscriptionEquipeTournoi> getAllByEquipe(
          @PathVariable Long equipeId,
          @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
            equipeId, currentUser, "You can only view your own team registrations");
    Iterable<InscriptionEquipeTournoi> inscriptions =
            inscriptionService.getAllByEquipe(equipeId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return inscriptions;
  }

  /** Inscrit une équipe à un tournoi. Réservé au responsable de l'équipe. */
  @PostMapping("/{tournoiId}/inscriptions/equipes/{equipeId}")
  @ResponseStatus(HttpStatus.CREATED)
  @IsResponsable
  public InscriptionEquipeTournoi register(
          @PathVariable Long tournoiId,
          @PathVariable Long equipeId,
          @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
            equipeId, currentUser, "You can only register your own team");
    InscriptionEquipeTournoi inscription =
            inscriptionService.register(tournoiId, equipeId);
    if (inscription == null) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Tournament not found, not OUVERT, or team already registered");
    }
    return inscription;
  }

  /** Désinscrit une équipe d'un tournoi. Réservé au responsable de l'équipe ou à un admin. */
  @DeleteMapping("/inscriptions/{inscriptionId}")
  @IsAdminOrResponsable
  public void unregister(
          @PathVariable Long inscriptionId,
          @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      InscriptionEquipeTournoi existing = inscriptionService.getById(inscriptionId);
      if (existing == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registration not found");
      }
      ensureCurrentUserResponsibleForTeam(
              existing.getEquipe().getId(), currentUser,
              "You can only unregister your own team");
    }
    boolean success = inscriptionService.unregister(inscriptionId);
    if (!success) {
      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Registration not found, tournament already started, or registration deadline passed");
    }
  }

  private void ensureCurrentUserResponsibleForTeam(
          Long equipeId, User currentUser, String forbiddenMessage) {
    if (currentUser.isAdmin()) return;
    Equipe equipe = equipeService.getEquipeById(equipeId).orElse(null);
    if (equipe == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    if (!equipeService.isUserResponsible(equipe, currentUser)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
    }
  }
}