package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.UnavailabilityMapper;
import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityResponseDto;
import be.vinci.ipl.cae.demo.repositories.UnavailabilityRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller handling availability blackout periods.
 */
@RestController
@RequestMapping("/indisponibilites")
public class UnavailabilityController {

  private final UnavailabilityRepository indisponibiliteRepository;
  private final UserRepository userRepository;
  private final UnavailabilityMapper unavailabilityMapper;

  /**
   * Builds the controller.
   *
   * @param indisponibiliteRepository blackout-period repository.
   */
  public UnavailabilityController(
      UnavailabilityRepository indisponibiliteRepository,
      UserRepository userRepository,
      UnavailabilityMapper unavailabilityMapper) {
    this.indisponibiliteRepository = indisponibiliteRepository;
    this.userRepository = userRepository;
    this.unavailabilityMapper = unavailabilityMapper;
  }

  /**
   * Gets all blackout periods for the authenticated user.
   *
   * @return list of periods.
   */
  @GetMapping
  public Iterable<UnavailabilityResponseDto> getMesIndisponibilites(
      @AuthenticationPrincipal(expression = "id") Long currentUserId) {
    ensureAuthenticated(currentUserId);
    var currentUser = userRepository.findById(currentUserId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED, "Utilisateur non authentifié."));
    java.util.List<UnavailabilityResponseDto> result = new java.util.ArrayList<>();
    for (var indisponibilite : indisponibiliteRepository.findByUser(currentUser)) {
      result.add(unavailabilityMapper.toDto(indisponibilite));
    }
    return result;
  }

  /**
   * Saves a new blackout period.
   *
   * @param indisponibilite new period sent by the frontend.
   * @return saved period.
   */
  @PostMapping
  public UnavailabilityResponseDto addIndisponibilite(
      @AuthenticationPrincipal(expression = "id") Long currentUserId,
      @RequestBody @Valid UnavailabilityCreateDto indisponibilite) {
    ensureAuthenticated(currentUserId);
    var currentUser = userRepository.findById(currentUserId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED, "Utilisateur non authentifié."));
    var entity = unavailabilityMapper.toEntity(indisponibilite);
    entity.setUser(currentUser);
    return unavailabilityMapper.toDto(indisponibiliteRepository.save(entity));
  }

  /**
   * Deletes a blackout period by ID.
   *
    * @param id period identifier.
   */
  @DeleteMapping("/{id}")
  public void deleteIndisponibilite(
      @PathVariable Long id,
      @AuthenticationPrincipal(expression = "id") Long currentUserId) {
    ensureAuthenticated(currentUserId);

    var indisponibilite = indisponibiliteRepository
        .findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Indisponibilite introuvable"
            )
        );

    if (!indisponibilite.getUser().getId().equals(currentUserId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres indisponibilites."
      );
    }

    indisponibiliteRepository.delete(indisponibilite);
  }

  /**
   * Internal helper to check authentication.
   *
   * @param currentUserId the user id to check.
   */
  private void ensureAuthenticated(Long currentUserId) {
    if (currentUserId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifié.");
    }
  }
}