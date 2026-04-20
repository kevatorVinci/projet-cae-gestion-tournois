package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.MatchMapper;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchDto;
import be.vinci.ipl.cae.demo.services.MatchService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller providing endpoints for match operations.
 */
@RestController
@RequestMapping("/matches")
public class MatchController {

  private final MatchService matchService;
  private final MatchMapper matchMapper;

  /**
   * Constructor for MatchController.
   *
   * @param matchService the match service
   * @param matchMapper  the match mapper
   */
  public MatchController(MatchService matchService, MatchMapper matchMapper) {
    this.matchService = matchService;
    this.matchMapper = matchMapper;
  }

  /**
   * Endpoint to get a single match by its ID.
   *
   * @param id The ID from the URL path.
   * @return A response containing the MatchDto.
   */
  @GetMapping("/{id}")
  public ResponseEntity<MatchDto> getOne(@PathVariable Long id) {
    var match = matchService.getOne(id);

    if (match == null) {
      return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(matchMapper.toDto(match));
  }

  /**
   * Endpoint to retrieve all matches a specific team has played or will play.
   *
   * @param equipeId the ID of the team.
   * @return a list of matches involving the team.
   */
  @GetMapping("/equipes/{equipeId}/matches")
  public ResponseEntity<List<MatchDto>> getMatchesByTeam(@PathVariable Long equipeId) {
    return ResponseEntity.ok(matchMapper.toDtos(matchService.getMatchesByTeam(equipeId)));
  }
}
