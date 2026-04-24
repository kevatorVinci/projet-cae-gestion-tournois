package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository for MatchResult. */
@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {

  /**
   * Finds all match results encoded before a specific time, where at least one team has a "PENDING"
   * validation status.
   *
   * @param limit the time limit (e.g., 2 hours ago).
   * @return list of pending match results older than the limit.
   */
  @Query(
      "SELECT r FROM MatchResult r WHERE r.encodingDate < :limit "
          + "AND (r.validationStatusTeam1 = 'PENDING' OR r.validationStatusTeam2 = 'PENDING')")
  List<MatchResult> findPendingResultsOlderThan(@Param("limit") LocalDateTime limit);
}
