package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TournoiRepository extends CrudRepository<Tournoi, Long> {

    // Vérifie si un tournoi avec ce nom existe déjà (nom UNIQUE dans le DSD)
    Optional<Tournoi> findByNom(String nom);
}