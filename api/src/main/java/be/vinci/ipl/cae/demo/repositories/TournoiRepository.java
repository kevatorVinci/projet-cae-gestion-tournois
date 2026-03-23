package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for tournament persistence operations. */
@Repository
public interface TournoiRepository extends CrudRepository<Tournoi, Long> {

  /**
   * Finds a tournament by its unique name.
   *
   * @param nom tournament name
   * @return optional tournament if found
   */
  Optional<Tournoi> findByNom(String nom);

  List<Tournoi> findByEtat(String etat);

  List<Tournoi> findByNomContainingIgnoreCase(String nom);

  List<Tournoi> findByEtatAndNomContainingIgnoreCase(String etat, String nom);
}