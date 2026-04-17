package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelectionId;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for PlayerSelection using the composite primary key class.
 */
@Repository
public interface PlayerSelectionRepository extends CrudRepository<PlayerSelection, PlayerSelectionId> {
}