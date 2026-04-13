package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for team operations.
 */
@Repository
public interface TeamRepository extends CrudRepository<Team, Long> {

  /**
   * Find a team by name.
   */
  Optional<Team> findByName(String name);

  /**
   * Returns teams with at least one member.
   * 🇬🇧 On utilise "Members" car la variable dans Team.java s'appelle "members" !
   */
  Iterable<Team> findByMembersIsNotEmpty();

  /**
   * Checks if a team name already exists.
   */
  boolean existsByName(String name);

  /**
   * Finds the team where the given user is a responsible (primary or secondary).
   */
  Optional<Team> findByPrimaryResponsibleIdOrSecondaryResponsibleId(
    Long primaryId, Long secondaryId);
}