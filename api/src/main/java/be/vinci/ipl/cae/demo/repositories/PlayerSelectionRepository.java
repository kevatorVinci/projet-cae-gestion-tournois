package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelectionId;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for PlayerSelection.
 */
@Repository
public interface PlayerSelectionRepository
        extends CrudRepository<PlayerSelection, PlayerSelectionId> {

    /**
     * Finds all player selections for a specific match.
     *
     * @param matchId The ID of the match.
     * @return A list of selections.
     */
    Iterable<PlayerSelection> findByMatchId(Long matchId);
}