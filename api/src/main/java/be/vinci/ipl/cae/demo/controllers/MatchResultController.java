package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.MatchResultMapper;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultDto;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.services.MatchResultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
        MatchResult savedResult = matchResultService.encodeResult(matchId, createDto);

        if (savedResult == null) {
            return ResponseEntity.badRequest().build();
        }

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
        MatchResult result = matchResultService.getResultForMatch(matchId);

        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(matchResultMapper.toDto(result));
    }
}