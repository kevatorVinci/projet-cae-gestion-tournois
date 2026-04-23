package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelectionId;
import java.time.LocalDateTime;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for PlayerSelection.
 */
@Repository
public interface PlayerSelectionRepository
    extends CrudRepository<PlayerSelection, PlayerSelectionId> {

  /**
   * Finds all player selections for a specific match.
   *
   * @param matchId The ID of the match.
   * @return A list of selections.
   */
  Iterable<PlayerSelection> findByMatchId(Long matchId);

  /**
   * Finds selections for a specific match and team.
   *
   * @param matchId the match ID.
   * @param teamId  the team ID.
   * @return selections for the team in the match.
   */
  Iterable<PlayerSelection> findByMatchIdAndTeamId(Long matchId, Long teamId);

  /**
   * Deletes all selections for one team in one match.
   *
   * @param matchId the match ID.
   * @param teamId  the team ID.
   */
  void deleteByMatchIdAndTeamId(Long matchId, Long teamId);

  /**
   * Finds all selections where a given member was lined up.
   *
   * @param memberId the member ID.
   * @return selections referencing this member.
   */
  Iterable<PlayerSelection> findByMemberId(Long memberId);

  /**
   * Deletes selections for a member when matches are still in the future.
   *
   * @param memberId member identifier.
   * @param thresholdDateTime only matches strictly after this date-time are targeted.
   * @return number of deleted selection rows.
   */
  long deleteByMemberIdAndMatchScheduledDateTimeAfter(Long memberId, LocalDateTime thresholdDateTime);

  /**
   * Deletes selections for a member in a date-time window.
   *
   * @param memberId member identifier.
   * @param fromDateTime lower bound (inclusive).
   * @param toDateTime upper bound (exclusive).
   * @return number of deleted rows.
   */
  long deleteByMemberIdAndMatchScheduledDateTimeGreaterThanEqualAndMatchScheduledDateTimeLessThan(
      Long memberId,
      LocalDateTime fromDateTime,
      LocalDateTime toDateTime
  );
}