package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for team (Equipe) operations. */
@Repository
public interface EquipeRepository extends CrudRepository<Equipe, Long> {

  /**
   * Find a team by name.
   *
   * @param name team name
   * @return optional team
   */
  Optional<Equipe> findByName(String name);

  /**
   * Returns teams with at least one member.
   *
   * @return active teams
   */
  Iterable<Equipe> findByMembresIsNotEmpty();

  /**
   * Checks if a team name already exists.
   *
   * @param name team name
   * @return true when the name is already used
   */
  boolean existsByName(String name);

  /**
   * Finds the team where the given user is a responsible (primary or secondary).
   *
   * @param principalId user id to match as primary responsible
   * @param secondaryId user id to match as secondary responsible
   * @return matching team when found
   */
  Optional<Equipe> findByResponsablePrincipalIdOrResponsableSecondaireId(
      Long principalId, Long secondaryId);
}
