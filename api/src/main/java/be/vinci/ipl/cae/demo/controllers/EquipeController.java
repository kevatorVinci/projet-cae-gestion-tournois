package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeCreationDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeJoinDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipePublicDto;
import be.vinci.ipl.cae.demo.models.dtos.membre.MembrePublicDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for public team (Equipe) operations.
 *
 * <p>Ce controller ne gère PAS la création ou l'adhésion à une équipe. Ces actions sont liées aux
 * membres et sont donc dans MembreController.
 */
@RestController
@RequestMapping("/equipes")
public class EquipeController {

  private final EquipeService equipeService;

  /**
   * Constructor for EquipeController.
   *
   * @param equipeService the injected service.
   */
  public EquipeController(EquipeService equipeService) {
    this.equipeService = equipeService;
  }

  /** Récupérer toutes les équipes (version publique). */
  @GetMapping({"", "/"})
  public Iterable<EquipePublicDto> readAllEquipes(@AuthenticationPrincipal User currentUser) {
    List<EquipePublicDto> equipes = new ArrayList<>();
    for (Equipe equipe : equipeService.getAllEquipes()) {
      equipes.add(toPublicDto(equipe, currentUser));
    }
    return equipes;
  }

  /** Récupérer une équipe par son identifiant. */
  @GetMapping("/{id}")
  public EquipePublicDto readOneEquipe(
      @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
    Equipe equipe =
        equipeService
            .getEquipeById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe introuvable"));
    return toPublicDto(equipe, currentUser);
  }

  /**
   * Create a team for a given user id.
   *
   * @param userId user id
   * @param dto creation payload
   * @return created team
   */
  @PostMapping("/{userId}/equipes")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  public Equipe creerEquipe(
      @PathVariable Long userId,
      @RequestBody EquipeCreationDto dto,
      @AuthenticationPrincipal User currentUser) {

    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Vous ne pouvez créer une équipe que pour votre propre compte.");
    }

    try {
      Equipe equipe = equipeService.creerEquipe(currentUser, dto.name());
      if (equipe == null) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Nom d'equipe deja utilise");
      }
      return equipe;
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  /**
   * Join an existing team for a given user id.
   *
   * @param userId user id
   * @param dto join payload
   */
  @PostMapping("/{userId}/equipes/rejoindre")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void rejoindreEquipe(
      @PathVariable Long userId,
      @RequestBody EquipeJoinDto dto,
      @AuthenticationPrincipal User currentUser) {
    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Vous ne pouvez rejoindre une équipe que pour votre propre compte.");
    }

    try {
      equipeService.demanderRejoindreEquipe(currentUser, dto.equipeId());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }

  /**
   * Leave current team for a given user id.
   *
   * @param userId user id
   * @param currentUser authenticated user
   */
  @PostMapping("/{userId}/equipes/quitter")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void quitterEquipe(
      @PathVariable Long userId,
      @RequestBody(required = false) Map<String, Long> body,
      @AuthenticationPrincipal User currentUser) {

    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Vous ne pouvez quitter l'equipe que pour votre propre compte.");
    }

    try {
      Long nouveauResponsableId = body == null ? null : body.get("nouveauResponsableId");
      equipeService.quitterEquipe(currentUser, nouveauResponsableId);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  /**
   * Promote a member to responsible role.
   *
   * @param userId authenticated user id
   * @param membreId member id to promote
   * @param currentUser authenticated user
   */
  @PostMapping("/{userId}/equipes/responsables/{membreId}/promouvoir")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void promouvoirResponsable(
      @PathVariable Long userId,
      @PathVariable Long membreId,
      @AuthenticationPrincipal User currentUser) {
    ensureSelfTeamManagement(userId, currentUser);
    executeTeamAction(() -> equipeService.promouvoirResponsable(currentUser, membreId));
  }

  /**
   * Demote a responsible to regular member.
   *
   * @param userId authenticated user id
   * @param membreId responsible member id to demote
   * @param currentUser authenticated user
   */
  @PostMapping("/{userId}/equipes/responsables/{membreId}/depromouvoir")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void depromouvoirResponsable(
      @PathVariable Long userId,
      @PathVariable Long membreId,
      @AuthenticationPrincipal User currentUser) {
    ensureSelfTeamManagement(userId, currentUser);
    executeTeamAction(() -> equipeService.depromouvoirResponsable(currentUser, membreId));
  }

  /** Vérifie si l'utilisateur courant est responsable de son équipe. */
  @GetMapping("/me/isResponsable")
  @PreAuthorize("isAuthenticated()")
  public boolean isCurrentUserResponsable(@AuthenticationPrincipal User currentUser) {
    return equipeService.isCurrentUserResponsible(currentUser);
  }

  // 👇 Ici, on a bien nos deux paramètres ! (C'est ce qui faisait l'erreur rouge)
  private void ensureSelfTeamManagement(Long userId, User currentUser) {
    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Vous ne pouvez gerer les responsables que pour votre propre compte.");
    }
  }

  private void executeTeamAction(Runnable action) {
    try {
      action.run();
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  private EquipePublicDto toPublicDto(Equipe equipe, User currentUser) {
    List<MembrePublicDto> membres =
        equipe.getMembres().stream()
            .map(
                m ->
                    new MembrePublicDto(
                        m.getId(),
                        m.getTag(),
                        m.getSpecialty(),
                        m.getProfileImageUrl(),
                        equipeService.isUserResponsible(equipe, m)))
            .toList();

    boolean isResponsable = equipeService.isUserResponsible(equipe, currentUser);
    return new EquipePublicDto(equipe.getId(), equipe.getName(), membres, isResponsable);
  }
}
