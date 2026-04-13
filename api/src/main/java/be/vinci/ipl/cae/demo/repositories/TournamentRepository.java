package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Tournament;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for tournament persistence operations.
 */
@Repository
public interface TournamentRepository extends CrudRepository<Tournament, Long> {

  /**
   * Finds a tournament by its unique name.
   *
   * @param name tournament name
   * @return optional tournament if found
   */
  Optional<Tournament> findByName(String name);

  /**
   * Finds tournaments by exact state value.
   */
  List<Tournament> findByStatus(String status);

  /**
   * Finds tournaments whose names contain the given text, case-insensitive.
   */
  List<Tournament> findByNameContainingIgnoreCase(String name);

  /**
   * Finds tournaments by state and name fragment, case-insensitive on name.
   */
  List<Tournament> findByStatusAndNameContainingIgnoreCase(String status, String name);
}