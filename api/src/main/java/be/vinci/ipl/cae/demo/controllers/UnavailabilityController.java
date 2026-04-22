package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.UnavailabilityMapper;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityResponseDto;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.PlayerSelectionRepository;
import be.vinci.ipl.cae.demo.repositories.UnavailabilityRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import be.vinci.ipl.cae.demo.services.NotificationService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
  private final PlayerSelectionRepository playerSelectionRepository;
  private final MatchRepository matchRepository;
  private final NotificationService notificationService;

  /**
   * Builds the controller.
   *
   * @param indisponibiliteRepository blackout-period repository.
   */
  public UnavailabilityController(
      UnavailabilityRepository indisponibiliteRepository,
      UserRepository userRepository,
      UnavailabilityMapper unavailabilityMapper,
      PlayerSelectionRepository playerSelectionRepository,
      MatchRepository matchRepository,
      NotificationService notificationService) {
    this.indisponibiliteRepository = indisponibiliteRepository;
    this.userRepository = userRepository;
    this.unavailabilityMapper = unavailabilityMapper;
    this.playerSelectionRepository = playerSelectionRepository;
    this.matchRepository = matchRepository;
    this.notificationService = notificationService;
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
    Unavailability saved = indisponibiliteRepository.save(entity);
    removeSelectionsConflictingWithUnavailability(currentUser, saved);
    return unavailabilityMapper.toDto(saved);
  }

  /**
   * Deletes a blackout period by ID.
   *
   * @param id          period identifier.
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

  /**
   * Removes future selections that conflict with the newly created unavailability.
   *
   * @param user the player who became unavailable.
   * @param unavailability the newly saved unavailable period.
   */
  private void removeSelectionsConflictingWithUnavailability(User user, Unavailability unavailability) {
    if (user == null || unavailability == null) {
      return;
    }

    LocalDate startDate = unavailability.getStartDate();
    LocalDate endDate = unavailability.getEndDate();
    if (startDate == null || endDate == null) {
      return;
    }

    List<PlayerSelection> conflictingSelections = new ArrayList<>();
    for (PlayerSelection selection : playerSelectionRepository.findByMemberId(user.getId())) {
      Match match = selection.getMatch();
      if (match == null || match.getScheduledDateTime() == null) {
        continue;
      }

      LocalDate matchDate = match.getScheduledDateTime().toLocalDate();
      if (matchDate.isBefore(startDate) || matchDate.isAfter(endDate)) {
        continue;
      }

      conflictingSelections.add(selection);
    }

    if (conflictingSelections.isEmpty()) {
      return;
    }

    for (PlayerSelection selection : conflictingSelections) {
      playerSelectionRepository.delete(selection);

      notificationService.notifySelectionRemovedDueToUnavailability(user, selection);
    }
  }
}