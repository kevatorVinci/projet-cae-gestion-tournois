package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Indisponibilite;
import be.vinci.ipl.cae.demo.models.entities.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for managing unavailable periods in the database. */
@Repository
public interface IndisponibiliteRepository extends CrudRepository<Indisponibilite, Long> {

  /**
   * Finds all unavailable periods for a specific player.
   *
   * @param user target player
   * @return list of unavailable periods
   */
  Iterable<Indisponibilite> findByUser(User user);
}
