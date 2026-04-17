package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.MatchMapper;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.services.MatchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

/**
 * REST Controller providing endpoints for match operations.
 */
@RestController
@RequestMapping("/matches") // All endpoints in this class start with /matches
public class MatchController {

  private final MatchService matchService;
  private final MatchMapper matchMapper;

  public MatchController(MatchService matchService, MatchMapper matchMapper) {
    this.matchService = matchService; // Injecting the service
    this.matchMapper = matchMapper; // Injecting the mapper
  }

  /**
   * Endpoint to get a single match by its ID.
   * @param id The ID from the URL path.
   * @return A response containing the MatchDto.
   */
  @GetMapping("/{id}")
  public ResponseEntity<MatchDto> getOne(@PathVariable Long id) {
    Match match = matchService.getOne(id); // Asks the service for the match

    if (match == null) {
      return ResponseEntity.notFound().build(); // Returns 404 if not found
    }

    return ResponseEntity.ok(matchMapper.toDto(match)); // Converts to DTO and returns 200 OK
  }
}