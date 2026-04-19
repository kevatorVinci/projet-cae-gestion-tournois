package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdminOrResponsable;
import be.vinci.ipl.cae.demo.mappers.PlayerSelectionMapper;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionDto;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionTeamViewDto;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionUpdateDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.PlayerSelectionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller for managing player selections in matches.
 */
@RestController
@RequestMapping("/selections")
public class PlayerSelectionController {

  private final PlayerSelectionService playerSelectionService;
  private final PlayerSelectionMapper playerSelectionMapper;

  /**
   * Constructor.
   *
   * @param playerSelectionService the service
   * @param playerSelectionMapper  the mapper
   */
  public PlayerSelectionController(
      PlayerSelectionService playerSelectionService,
      PlayerSelectionMapper playerSelectionMapper) {
    this.playerSelectionService = playerSelectionService;
    this.playerSelectionMapper = playerSelectionMapper;
  }

  /**
   * Updates the selected lineup for one team in one match.
   *
   * @param matchId the match id.
   * @param teamId the team id.
   * @param payload selected member ids payload.
   * @param currentUser current authenticated user.
   * @return updated player selections.
   */
  @PostMapping("/match/{matchId}/team/{teamId}")
  @IsAdminOrResponsable
  public ResponseEntity<Iterable<PlayerSelectionDto>> updateLineup(
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @RequestBody PlayerSelectionUpdateDto payload,
      @AuthenticationPrincipal User currentUser) {
    try {
      List<PlayerSelectionDto> dtos = playerSelectionMapper.toDtos(
          playerSelectionService.updateTeamSelections(
          matchId,
          teamId,
          payload == null ? List.of() : payload.getMemberIds(),
          currentUser
      ));

      return ResponseEntity.status(HttpStatus.CREATED).body(dtos);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (SecurityException e) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    }
  }

  /**
   * Gets all players selected for a specific match.
   *
   * @param matchId the match id
   * @return list of selections
   */
  @GetMapping("/match/{matchId}")
  public ResponseEntity<Iterable<PlayerSelectionDto>> getAllForMatch(
      @PathVariable Long matchId,
      @AuthenticationPrincipal User currentUser) {
    try {
      List<PlayerSelectionDto> dtos = playerSelectionMapper.toDtos(
          playerSelectionService.getSelectionsForMatch(
          matchId,
          currentUser
      ));
      return ResponseEntity.ok(dtos);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }
  }

  /**
   * Returns one team's lineup state (eligible members + selected state) for one match.
   *
   * @param matchId     the match id.
   * @param teamId      the team id.
   * @param currentUser the current authenticated user.
   * @return lineup context for selection screen.
   */
  @GetMapping("/match/{matchId}/team/{teamId}/editor")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<PlayerSelectionTeamViewDto> getTeamLineupEditor(
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @AuthenticationPrincipal User currentUser) {
    try {
      PlayerSelectionTeamViewDto response = playerSelectionService.getTeamSelectionView(
          matchId,
          teamId,
          currentUser
      );
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    } catch (SecurityException e) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    }
  }
}