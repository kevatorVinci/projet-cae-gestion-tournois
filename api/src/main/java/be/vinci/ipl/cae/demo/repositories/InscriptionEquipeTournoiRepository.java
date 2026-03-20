package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionEquipeTournoiRepository extends CrudRepository<InscriptionEquipeTournoi, Long> {

    // Toutes les inscriptions d'un tournoi donné
    List<InscriptionEquipeTournoi> findByTournoi(Tournoi tournoi);

    // Toutes les inscriptions d'une équipe donnée
    List<InscriptionEquipeTournoi> findByEquipe(Equipe equipe);

    // Vérifie si une équipe est déjà inscrite à un tournoi
    // (remplace la contrainte de clé composite — on gère le doublon au niveau service)
    Optional<InscriptionEquipeTournoi> findByTournoiAndEquipe(Tournoi tournoi, Equipe equipe);
}