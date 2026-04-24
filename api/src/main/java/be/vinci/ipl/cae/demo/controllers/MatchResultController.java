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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controller for managing match results. */
@RestController
@RequestMapping("/results")
public class MatchResultController {

  private final MatchResultService matchResultService;
  private final MatchResultMapper matchResultMapper;

  /**
   * Constructor for MatchResultController.
   *
   * @param matchResultService the service managing results
   * @param matchResultMapper the mapper for results
   */
  public MatchResultController(
      MatchResultService matchResultService, MatchResultMapper matchResultMapper) {
    this.matchResultService = matchResultService;
    this.matchResultMapper = matchResultMapper;
  }

  /**
   * Encodes a new result for a given match. Sets match to WAITING_VALIDATION and notifies both team
   * responsibles.
   *
   * @param matchId the ID of the match
   * @param createDto the DTO containing the result details
   * @return a response entity with the created result
   */
  @PostMapping("/match/{matchId}")
  public ResponseEntity<MatchResultDto> createResult(
      @PathVariable Long matchId, @RequestBody MatchResultCreateDto createDto) {
    var savedResult = matchResultService.encodeResult(matchId, createDto);

    if (savedResult == null) {
      return ResponseEntity.badRequest().build();
    }

    return ResponseEntity.status(HttpStatus.CREATED).body(matchResultMapper.toDto(savedResult));
  }

  /**
   * Gets the result of a specific match.
   *
   * @param matchId the ID of the match
   * @return a response entity with the match result
   */
  @GetMapping("/match/{matchId}")
  public ResponseEntity<MatchResultDto> getResult(@PathVariable Long matchId) {
    var result = matchResultService.getResultForMatch(matchId);

    if (result == null) {
      return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(matchResultMapper.toDto(result));
  }

  /**
   * A team validates or disputes a match result. Each team can only act once.
   *
   * @param matchId the ID of the match
   * @param teamId the ID of the team validating/disputing
   * @param accepted true to validate, false to dispute
   * @return the updated result, or 400 if invalid
   */
  @PutMapping("/match/{matchId}/validate")
  public ResponseEntity<MatchResultDto> validateResult(
      @PathVariable Long matchId, @RequestParam Long teamId, @RequestParam boolean accepted) {
    var updated = matchResultService.validateResult(matchId, teamId, accepted);

    if (updated == null) {
      return ResponseEntity.badRequest().build();
    }

    return ResponseEntity.ok(matchResultMapper.toDto(updated));
  }

  /**
   * Admin re-encodes a definitive result after a dispute. No further dispute possible.
   *
   * @param matchId the ID of the match
   * @param createDto the new result details
   * @return the updated definitive result, or 400 if match is not DISPUTED
   */
  @PutMapping("/match/{matchId}/definitive")
  public ResponseEntity<MatchResultDto> encodeDefinitiveResult(
      @PathVariable Long matchId, @RequestBody MatchResultCreateDto createDto) {
    var updated = matchResultService.encodeDefinitiveResult(matchId, createDto);

    if (updated == null) {
      return ResponseEntity.badRequest().build();
    }

    return ResponseEntity.ok(matchResultMapper.toDto(updated));
  }
}
