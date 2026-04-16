package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.services.MatchService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to handle requests related to Matches and Schedules.
 */
@RestController
@RequestMapping("/tournaments")
public class MatchController {

  private final MatchService matchService;

  /**
   * Constructor.
   * Links our entry point (Controller) to our brain (Service).
   *
   * @param matchService the injected match service.
   */
  public MatchController(MatchService matchService) {
    this.matchService = matchService;
  }

  /**
   * Endpoint to generate the schedule for a specific tournament.
   * React will send a POST request here to start the match creation.
   *
   * @param tournamentId the ID of the tournament from the URL.
   */
  @PostMapping("/{tournamentId}/schedule")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  public void generateSchedule(@PathVariable Long tournamentId) {
    // Ask the service to do the hard work of generating matches!
    matchService.generateTournamentSchedule(tournamentId);
  }

  /**
   * Endpoint to retrieve all matches for a specific tournament.
   * React will send a GET request here to display the tournament bracket.
   *
   * @param tournamentId the ID of the tournament from the URL.
   * @return a list of matches.
   */
  @GetMapping("/{tournamentId}/matches")
  public List<Match> getMatches(@PathVariable Long tournamentId) {
    return matchService.getTournamentMatches(tournamentId);
  }

  /**
   * Endpoint to retrieve all matches a specific team has played or will play.
   *
   * @param equipeId the ID of the team.
   * @return a list of matches involving the team.
   */
  @GetMapping("/equipes/{equipeId}/matches")
  public List<Match> getMatchesByTeam(@PathVariable Long equipeId) {
    return matchService.getMatchesByTeam(equipeId);
  }
}