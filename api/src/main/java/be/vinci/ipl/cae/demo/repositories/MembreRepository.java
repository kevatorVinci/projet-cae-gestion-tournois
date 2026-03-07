package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Membre;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for member (Membre) operations.
 */
@Repository
public interface MembreRepository extends CrudRepository<Membre, Long> {

  Optional<Membre> findByMail(String mail);

  boolean existsByMail(String mail);
}
