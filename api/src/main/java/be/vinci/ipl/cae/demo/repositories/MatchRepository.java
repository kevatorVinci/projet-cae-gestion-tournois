package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Match;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Match entity to perform database operations.
 */
@Repository
public interface MatchRepository extends CrudRepository<Match, Long> {
  // Spring will automatically implement basic methods like save(), findById(), etc.
}