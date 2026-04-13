package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Demand (join requests) entities. Provides database access for
 * managing team join requests.
 */
@Repository
public interface DemandRepository extends JpaRepository<Demand, Long> {

  /**
   * Find all demands for a team.
   *
   * @param teamId team id
   * @return demands for the team
   */
  Iterable<Demand> findByTeamId(Long teamId); // 🇬🇧 Ancien : findByEquipeId

  /**
   * Find all demands sent by one member.
   *
   * @param memberId member id
   * @return demands from that member
   */
  Iterable<Demand> findByMemberId(Long memberId); // 🇬🇧 Ancien : findByMembreId

  /**
   * Find team demands by state.
   *
   * @param teamId team id
   * @param state  target state
   * @return matching demands
   */
  Iterable<Demand> findByTeamIdAndState(Long teamId, DemandState state); // 🇬🇧 Ancien : findByEquipeIdAndEtat

  /**
   * Checks if a pending demand already exists for a member and a team.
   *
   * @param memberId member id
   * @param teamId   team id
   * @param state    target state
   * @return true when a matching demand exists
   */
  boolean existsByMemberIdAndTeamIdAndState(Long memberId, Long teamId, DemandState state); // 🇬🇧 Ancien : existsByMembreIdAndEquipeIdAndEtat

  /**
   * Deletes team demands by state.
   *
   * @param teamId team id
   * @param state  state to delete
   */
  void deleteByTeamIdAndState(Long teamId, DemandState state); // 🇬🇧 Ancien : deleteByEquipeIdAndEtat

  /**
   * Deletes member demands by state.
   *
   * @param memberId member id
   * @param state    state to delete
   */
  void deleteByMemberIdAndState(Long memberId, DemandState state); // 🇬🇧 Ancien : deleteByMembreIdAndEtat
}