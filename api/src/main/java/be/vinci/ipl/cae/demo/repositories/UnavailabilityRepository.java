package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.time.LocalDate;
import java.util.Optional;
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

  /**
   * Checks if the user is unavailable on the provided date.
   *
   * @param user target user.
   * @param startDate date lower bound (inclusive).
   * @param endDate date upper bound (inclusive).
   * @return true when at least one blackout period covers the date.
   */
  boolean existsByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
      User user,
      LocalDate startDate,
      LocalDate endDate
  );

  /**
   * Returns the first unavailability period that covers the provided date.
   *
   * @param user target user.
   * @param startDate date lower bound (inclusive).
   * @param endDate date upper bound (inclusive).
   * @return matching period when found.
   */
  Optional<Unavailability> findFirstByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateAsc(
      User user,
      LocalDate startDate,
      LocalDate endDate
  );
}