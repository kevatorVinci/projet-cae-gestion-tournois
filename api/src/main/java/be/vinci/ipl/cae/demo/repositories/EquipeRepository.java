package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for team (Equipe) operations. */
@Repository
public interface EquipeRepository extends CrudRepository<Equipe, Long> {

  Optional<Equipe> findByName(String name);

  Iterable<Equipe> findByMembresIsNotEmpty();

  boolean existsByName(String name);
}
