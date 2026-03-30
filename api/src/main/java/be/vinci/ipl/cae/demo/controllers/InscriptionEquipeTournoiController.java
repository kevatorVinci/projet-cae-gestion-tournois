package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.annotations.IsAdminOrResponsable;
import be.vinci.ipl.cae.demo.annotations.IsResponsable;
import be.vinci.ipl.cae.demo.mappers.InscriptionEquipeTournoiMapper;
import be.vinci.ipl.cae.demo.models.dtos.tournoi.EquipeTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournoi.TournoiEquipeInscriptionDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import be.vinci.ipl.cae.demo.services.InscriptionEquipeTournoiService;
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
public class InscriptionEquipeTournoiController {

  private final InscriptionEquipeTournoiService inscriptionService;
  private final EquipeService equipeService;
  private final InscriptionEquipeTournoiMapper inscriptionMapper;

  /** Creates the controller with required services. */
  public InscriptionEquipeTournoiController(
      InscriptionEquipeTournoiService inscriptionService,
      EquipeService equipeService,
      InscriptionEquipeTournoiMapper inscriptionMapper) {
    this.inscriptionService = inscriptionService;
    this.equipeService = equipeService;
    this.inscriptionMapper = inscriptionMapper;
  }

  /** Retourne toutes les inscriptions d'un tournoi. Réservé aux admins. */
  @GetMapping("/{tournoiId}/inscriptions")
  @IsAdmin
  public Iterable<InscriptionEquipeTournoi> getAllByTournoi(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions = inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptions;
  }

  /**
   * Retourne les inscriptions visibles publiquement pour la page détail tournoi.
   */
  @GetMapping("/{tournoiId}/inscriptions/accepted")
  public Iterable<TournoiEquipeInscriptionDto> getAcceptedByTournoi(@PathVariable Long tournoiId) {
    Iterable<InscriptionEquipeTournoi> inscriptions = inscriptionService.getAllByTournoi(tournoiId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found");
    }
    return inscriptionMapper.toTournoiEquipeInscriptionDtos(inscriptions);
  }

  /**
   * Retourne toutes les inscriptions d'une équipe. Accessible au responsable ou à
   * un admin.
   */
  @GetMapping("/equipes/{equipeId}/inscriptions")
  @IsAdminOrResponsable
  public Iterable<EquipeTournamentRegistrationDto> getAllByEquipe(
      @PathVariable Long equipeId,
      @AuthenticationPrincipal User currentUser) {
    ensureCurrentUserResponsibleForTeam(
        equipeId, currentUser, "You can only view your own team registrations");
    Iterable<InscriptionEquipeTournoi> inscriptions = inscriptionService.getAllByEquipe(equipeId);
    if (inscriptions == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    return inscriptionMapper.toEquipeTournamentRegistrationDtos(inscriptions);
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
    InscriptionEquipeTournoi inscription;
    try {
      inscription = inscriptionService.register(tournoiId, equipeId);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
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
          HttpStatus.FORBIDDEN,
          "A responsible cannot unregister a team from a tournament");
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
      @PathVariable Long inscriptionId,
      @AuthenticationPrincipal User currentUser) {
    if (!currentUser.isAdmin()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "A responsible cannot unregister a team from a tournament");
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
    Equipe equipe = equipeService.getEquipeById(equipeId).orElse(null);
    if (equipe == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
    }
    if (!equipeService.isUserResponsible(equipe, currentUser)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
    }
  }

}