package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service handling the business logic for matches.
 */
@Service
public class MatchService {

  /**
   * Repository used to access match data in the database.
   */
  private final MatchRepository matchRepository;

  /**
   * Constructor with dependency injection.
   *
   * @param matchRepository the repository for matches.
   */
  public MatchService(MatchRepository matchRepository) {
    this.matchRepository = matchRepository;
  }

  /**
   * Updates the result of a match and determines the winner.
   *
   * @param matchId the unique identifier of the match.
   * @param score1  the score of the first team.
   * @param score2  the score of the second team.
   * @return the updated match entity.
   */
  public Match updateResult(Long matchId, Integer score1, Integer score2) {
    Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match not found"));

    match.setScoreTeam1(score1);
    match.setScoreTeam2(score2);

    if (score1 > score2) {
      match.setWinner(match.getTeam1());
    } else if (score2 > score1) {
      match.setWinner(match.getTeam2());
    } else {
      match.setWinner(null);
    }

    match.setStatus("FINISHED");
    return matchRepository.save(match);
  }

  /**
   * Generates the schedule for a tournament.
   *
   * @param tournamentId the unique identifier of the tournament.
   */
  public void generateTournamentSchedule(Long tournamentId) {
    // Logic to generate matches for the tournament
  }

  /**
   * Returns all matches for a specific tournament.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @return a list of matches belonging to the tournament.
   */
  public List<Match> getTournamentMatches(Long tournamentId) {
    return matchRepository.findByTournamentId(tournamentId);
  }
}