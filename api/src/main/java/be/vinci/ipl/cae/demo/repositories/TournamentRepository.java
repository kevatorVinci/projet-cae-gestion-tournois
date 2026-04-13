package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for tournament persistence operations.
 */
@Repository
public interface TournamentRepository extends CrudRepository<Tournament, Long> {

  /**
   * Finds a tournament by its unique name.
   *
   * @param name the tournament name.
   * @return an optional tournament if found.
   */
  Optional<Tournament> findByName(String name);

  /**
   * Finds tournaments by their exact status value.
   *
   * @param status the status to filter by.
   * @return a list of tournaments with the given status.
   */
  List<Tournament> findByStatus(String status);

  /**
   * Finds tournaments whose names contain the given text, case-insensitive.
   *
   * @param name the text to search for in names.
   * @return a list of matching tournaments.
   */
  List<Tournament> findByNameContainingIgnoreCase(String name);

  /**
   * Finds tournaments by status and name fragment, case-insensitive on name.
   *
   * @param status the status to filter by.
   * @param name   the text to search for in names.
   * @return a list of matching tournaments.
   */
  List<Tournament> findByStatusAndNameContainingIgnoreCase(String status, String name);
}