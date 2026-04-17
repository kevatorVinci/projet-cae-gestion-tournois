package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for team operations.
 */
@Repository
public interface TeamRepository extends CrudRepository<Team, Long> {

  /**
   * Finds a team by its unique name.
   *
   * @param name the name of the team.
   * @return an optional containing the team if found.
   */
  Optional<Team> findByName(String name);

  /**
   * Returns teams that have at least one member.
   *
   * @return an iterable of teams with members.
   */
  Iterable<Team> findByMembersIsNotEmpty();

  /**
   * Checks if a team name already exists in the database.
   *
   * @param name the name to check.
   * @return true if the name exists, false otherwise.
   */
  boolean existsByName(String name);

  /**
   * Finds the team where the given user is a responsible (primary or secondary).
   *
   * @param primaryId   the ID of the primary responsible.
   * @param secondaryId the ID of the secondary responsible.
   * @return an optional containing the team if found.
   */
  Optional<Team> findByPrimaryResponsibleIdOrSecondaryResponsibleId(
          Long primaryId, Long secondaryId);
}