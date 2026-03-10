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
   * Check whether a team name already exists.
   *
   * @param name team name
   * @return true when name already exists
   */
  boolean existsByName(String name);
}
