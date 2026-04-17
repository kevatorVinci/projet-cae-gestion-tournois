package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelectionId;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerSelectionRepository extends CrudRepository<PlayerSelection, PlayerSelectionId> {

    /**
     * Finds all player selections for a specific match.
     * Spring Data JPA creates the SQL query automatically based on the method name!
     */
    Iterable<PlayerSelection> findByMatchId(Long matchId);
}