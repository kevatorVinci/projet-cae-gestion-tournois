package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.services.MatchService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller to handle requests related to Matches and Schedules.
 */
@RestController
@RequestMapping({"/tournaments", "/tournois"})
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
  @IsAdmin
  public List<Match> generateSchedule(@PathVariable Long tournamentId) {
    try {
      matchService.generateTournamentSchedule(tournamentId);
      return matchService.getTournamentMatches(tournamentId);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }
  }

  /**
   * Publishes a generated schedule so all users can view it.
   *
   * @param tournamentId the ID of the tournament from the URL.
   */
  @PostMapping("/{tournamentId}/schedule/publish")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @IsAdmin
  public void publishSchedule(@PathVariable Long tournamentId) {
    try {
      matchService.publishTournamentSchedule(tournamentId);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
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
    return matchService.getTournamentPublicMatches(tournamentId);
  }

  /**
   * Admin-only preview of tournament matches before publication.
   *
   * @param tournamentId the ID of the tournament.
   * @return all matches of the tournament.
   */
  @GetMapping("/{tournamentId}/matches/admin")
  @IsAdmin
  public List<Match> getMatchesForAdmin(@PathVariable Long tournamentId) {
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