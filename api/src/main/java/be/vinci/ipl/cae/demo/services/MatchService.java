package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;

import java.util.List;

import org.springframework.stereotype.Service;

/**
 * Service handling the business logic for matches.
 */
@Service
public class MatchService {

  private final MatchRepository matchRepository;

  /**
   * Constructor with dependency injection.
   */
  public MatchService(MatchRepository matchRepository) {
    this.matchRepository = matchRepository;
  }

  /**
   * Updates the result of a match and determines the winner.
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
      match.setWinner(null); // Draw
    }

    match.setStatus("FINISHED");
    return matchRepository.save(match);
  }

  /**
   * Returns all matches for a specific tournament.
   */
  public List<Match> getMatchesByTournament(Long tournamentId) {
    return matchRepository.findByTournamentId(tournamentId);
  }
}