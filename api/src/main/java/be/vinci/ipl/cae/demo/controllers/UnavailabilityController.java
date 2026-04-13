package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UnavailabilityRepository;
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

/** Controller handling availability blackout periods. */
@RestController
@RequestMapping("/indisponibilites")
public class UnavailabilityController {

  private final UnavailabilityRepository indisponibiliteRepository;

  /**
   * Builds the controller.
   *
   * @param indisponibiliteRepository blackout-period repository
   */
  public UnavailabilityController(UnavailabilityRepository indisponibiliteRepository) {
    this.indisponibiliteRepository = indisponibiliteRepository;
  }

  /**
   * Gets all blackout periods for the authenticated user.
   *
   * @param currentUser authenticated user
   * @return list of periods
   */
  @GetMapping
  public Iterable<Unavailability> getMesIndisponibilites(
      @AuthenticationPrincipal User currentUser) {
    ensureAuthenticated(currentUser);
    return indisponibiliteRepository.findByUser(currentUser);
  }

  /**
   * Saves a new blackout period.
   *
   * @param currentUser     authenticated user
   * @param indisponibilite new period sent by the frontend
   * @return saved period
   */
  @PostMapping
  public Unavailability addIndisponibilite(
      @AuthenticationPrincipal User currentUser,
      @RequestBody @Valid Unavailability indisponibilite) {
    ensureAuthenticated(currentUser);
    indisponibilite.setUser(currentUser);

    return indisponibiliteRepository.save(indisponibilite);
  }

  /**
   * Deletes a blackout period by ID.
   *
   * @param id          period identifier
   * @param currentUser authenticated user
   */
  @DeleteMapping("/{id}")
  public void deleteIndisponibilite(
      @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
    ensureAuthenticated(currentUser);

    Unavailability indisponibilite = indisponibiliteRepository
        .findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Indisponibilite introuvable"));

    if (!indisponibilite.getUser().getId().equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres indisponibilites.");
    }

    indisponibiliteRepository.delete(indisponibilite);
  }

  private void ensureAuthenticated(User currentUser) {
    if (currentUser == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie");
    }
  }
}
