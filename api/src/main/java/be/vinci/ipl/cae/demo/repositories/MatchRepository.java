package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Match;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for the Match entity.
 * This acts as the bridge between the Java code and the database for matches.
 */
@Repository
public interface MatchRepository extends CrudRepository<Match, Long> {

  /**
   * Finds all matches belonging to a specific tournament.
   *
   * @param tournamentId the ID of the tournament.
   * @return a list of matches for that tournament.
   */
  List<Match> findByTournamentId(Long tournamentId);

  /**
   * Finds tournament matches with a stable ordering shared by admin/public views.
   *
   * @param tournamentId the ID of the tournament.
   * @return ordered matches of the tournament.
   */
  List<Match> findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(Long tournamentId);

  /**
   * Finds all matches where a specific team is playing (either as team 1 or team 2).
   *
   * @param team1Id the ID of the team playing as team 1.
   * @param team2Id the ID of the team playing as team 2.
   * @return a list of matches involving the team.
   */
  List<Match> findByTeam1IdOrTeam2Id(Long team1Id, Long team2Id);
}