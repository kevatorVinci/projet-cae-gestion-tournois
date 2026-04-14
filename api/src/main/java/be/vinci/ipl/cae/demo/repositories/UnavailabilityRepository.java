package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing unavailable periods in the database.
 */
@Repository
public interface UnavailabilityRepository extends CrudRepository<Unavailability, Long> {

  /**
   * Finds all unavailable periods for a specific player.
   *
   * @param user the target player.
   * @return an iterable of unavailable periods for that player.
   */
  Iterable<Unavailability> findByUser(User user);
}