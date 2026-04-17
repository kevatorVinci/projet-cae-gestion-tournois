package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for MatchResult entity.
 */
@Repository
public interface MatchResultRepository extends CrudRepository<MatchResult, Long> {
}