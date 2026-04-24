package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Demand (join requests) entities. Provides database access for managing team join
 * requests.
 */
@Repository
public interface DemandRepository extends JpaRepository<Demand, Long> {

  /**
   * Finds all demands associated with a specific team.
   *
   * @param teamId the ID of the team.
   * @return an iterable of demands for the team.
   */
  Iterable<Demand> findByTeamId(Long teamId);

  /**
   * Finds all demands sent by a specific member.
   *
   * @param memberId the ID of the member.
   * @return an iterable of demands from that member.
   */
  Iterable<Demand> findByMemberId(Long memberId);

  /**
   * Finds team demands filtered by their current state.
   *
   * @param teamId the ID of the team.
   * @param state the target state of the demands.
   * @return an iterable of matching demands.
   */
  Iterable<Demand> findByTeamIdAndState(Long teamId, DemandState state);

  /**
   * Checks if a pending demand already exists for a specific member and team.
   *
   * @param memberId the ID of the member.
   * @param teamId the ID of the team.
   * @param state the state to check for.
   * @return true if a matching demand exists, false otherwise.
   */
  boolean existsByMemberIdAndTeamIdAndState(Long memberId, Long teamId, DemandState state);

  /**
   * Deletes all demands of a team that match a specific state.
   *
   * @param teamId the ID of the team.
   * @param state the state of the demands to delete.
   */
  void deleteByTeamIdAndState(Long teamId, DemandState state);

  /**
   * Deletes all demands of a member that match a specific state.
   *
   * @param memberId the ID of the member.
   * @param state the state of the demands to delete.
   */
  void deleteByMemberIdAndState(Long memberId, DemandState state);
}
