package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.MatchResultMapper;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultDto;
import be.vinci.ipl.cae.demo.services.MatchResultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for managing match results.
 */
@RestController
@RequestMapping("/results")
public class MatchResultController {

  private final MatchResultService matchResultService;
  private final MatchResultMapper matchResultMapper;

  /**
   * Constructor for MatchResultController.
   *
   * @param matchResultService the service managing results
   * @param matchResultMapper  the mapper for results
   */
  public MatchResultController(
        MatchResultService matchResultService,
        MatchResultMapper matchResultMapper) {
    this.matchResultService = matchResultService;
    this.matchResultMapper = matchResultMapper;
  }

  /**
   * Encodes a new result for a given match.
   *
   * @param matchId   the ID of the match
   * @param createDto the DTO containing the result details
   * @return a response entity with the created result
   */
  @PostMapping("/match/{matchId}")
  public ResponseEntity<MatchResultDto> createResult(
        @PathVariable Long matchId,
        @RequestBody MatchResultCreateDto createDto) {

    // Calls the service to encode the result
    var savedResult = matchResultService.encodeResult(matchId, createDto);

    // If the match or admin is not found, return a bad request
    if (savedResult == null) {
      return ResponseEntity.badRequest().build();
    }

    // Return the created result with a 201 status
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(matchResultMapper.toDto(savedResult));
  }

  /**
   * Gets the result of a specific match.
   *
   * @param matchId the ID of the match
   * @return a response entity with the match result
   */
  @GetMapping("/match/{matchId}")
  public ResponseEntity<MatchResultDto> getResult(@PathVariable Long matchId) {

    // Calls the service to get the result
    var result = matchResultService.getResultForMatch(matchId);

    // If no result is found, return a 404 not found
    if (result == null) {
      return ResponseEntity.notFound().build();
    }

    // Return the found result
    return ResponseEntity.ok(matchResultMapper.toDto(result));
  }

  /**
   * Validates or disputes a match result.
   * This is the endpoint called by the React frontend when a captain clicks "Accept" or "Dispute".
   *
   * @param matchId    the ID of the match
   * @param teamId     the ID of the team validating
   * @param isAccepted true if accepted, false if disputed
   * @return a response entity with the updated match result
   */
  @PostMapping("/match/{matchId}/validate/{teamId}")
  public ResponseEntity<MatchResultDto> validateResult(
        @PathVariable Long matchId,
        @PathVariable Long teamId,
        @RequestParam boolean isAccepted) {

    // Calls the service to update the validation status
    var updatedResult = matchResultService.validateResultByCaptain(matchId, teamId, isAccepted);

    // If the result doesn't exist, return a 404 not found
    if (updatedResult == null) {
      return ResponseEntity.notFound().build();
    }

    // Returns the updated result to the frontend
    return ResponseEntity.ok(matchResultMapper.toDto(updatedResult));
  }
}