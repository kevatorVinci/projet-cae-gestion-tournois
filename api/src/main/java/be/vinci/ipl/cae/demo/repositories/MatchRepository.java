package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Match;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository interface for Match entity to perform database operations. */
@Repository
public interface MatchRepository extends CrudRepository<Match, Long> {

  /**
   * Finds matches involving a specific team.
   *
   * @param team1Id the ID of team 1.
   * @param team2Id the ID of team 2.
   * @return a list of matches.
   */
  List<Match> findByTeam1IdOrTeam2Id(Long team1Id, Long team2Id);

  /**
   * Finds all matches for a given tournament.
   *
   * @param tournamentId the tournament ID.
   * @return a list of matches.
   */
  List<Match> findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(Long tournamentId);
}
