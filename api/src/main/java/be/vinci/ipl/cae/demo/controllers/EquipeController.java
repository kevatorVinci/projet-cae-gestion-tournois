package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeCreationDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeJoinDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipePublicDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeUpdateDto;
import be.vinci.ipl.cae.demo.models.dtos.membre.MembrePublicDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for public team (Equipe) operations.
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

  /** Retrieve all teams (public version). */
  @GetMapping({"", "/"})
  public Iterable<EquipePublicDto> readAllEquipes(@AuthenticationPrincipal User currentUser) {
    List<EquipePublicDto> equipes = new ArrayList<>();
    for (Equipe equipe : equipeService.getAllEquipes()) {
      equipes.add(toPublicDto(equipe, currentUser));
    }
    return equipes;
  }

  /** Retrieve a team by its ID. */
  @GetMapping("/{id}")
  public EquipePublicDto readOneEquipe(
          @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
    Equipe equipe = equipeService.getEquipeById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Équipe introuvable"));

    return toPublicDto(equipe, currentUser);
  }

  /**
   * Create a team for a given user id.
   *
   * @param userId user id
   * @param dto creation payload
   * @param currentUser the authenticated user
   * @return created team
   */
  @PostMapping("/{userId}/equipes")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  public Equipe creerEquipe(
          @PathVariable Long userId,
          @RequestBody @Valid EquipeCreationDto dto,
          @AuthenticationPrincipal User currentUser) {

    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "Vous ne pouvez créer une équipe que pour votre propre compte.");
    }

    try {
      Equipe equipe = equipeService.creerEquipe(currentUser, dto.name(), dto.profileImage());
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
   * @param currentUser the authenticated user
   */
  @PostMapping("/{userId}/equipes/rejoindre")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void rejoindreEquipe(
          @PathVariable Long userId,
          @RequestBody @Valid EquipeJoinDto dto,
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
   * @param body map containing optional new responsible id
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
              HttpStatus.FORBIDDEN,
              "Vous ne pouvez quitter l'equipe que pour votre propre compte.");
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

  /**
   * Checks if the current user is responsible for their team.
   *
   * @param currentUser the authenticated user
   * @return true if responsible
   */
  @GetMapping("/me/isResponsable")
  @PreAuthorize("isAuthenticated()")
  public boolean isCurrentUserResponsable(@AuthenticationPrincipal User currentUser) {
    return equipeService.isCurrentUserResponsible(currentUser);
  }

  /**
   * Updates the profile image of a specific team.
   *
   * @param equipeId the ID of the team
   * @param dto the payload containing the new image name
   * @param currentUser the authenticated user making the request
   */
  @PutMapping("/{equipeId}/image")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void updateEquipeImage(
          @PathVariable Long equipeId,
          @RequestBody @Valid EquipeUpdateDto dto,
          @AuthenticationPrincipal User currentUser) {

    try {
      equipeService.updateEquipeImage(equipeId, dto.profileImage(), currentUser);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }

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
    List<MembrePublicDto> membres = equipe.getMembres().stream()
            .map(m -> new MembrePublicDto(
                    m.getId(),
                    m.getTag(),
                    m.getSpecialty(),
                    m.getProfileImageUrl(),
                    equipeService.isUserResponsible(equipe, m)))
            .toList();

    boolean isResponsable = equipeService.isUserResponsible(equipe, currentUser);

    return new EquipePublicDto(
            equipe.getId(),
            equipe.getName(),
            equipe.getProfileImage(),
            membres,
            isResponsable
    );
  }
}