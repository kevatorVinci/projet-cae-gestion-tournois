package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for tournament-team registration persistence operations. */
@Repository
public interface InscriptionEquipeTournoiRepository
    extends CrudRepository<InscriptionEquipeTournoi, Long> {

  /**
   * Finds all registrations for a given tournament.
   *
   * @param tournoi tournament entity
   * @return list of tournament registrations
   */
  List<InscriptionEquipeTournoi> findByTournoi(Tournoi tournoi);

  /**
   * Finds all registrations for a given team.
   *
   * @param equipe team entity
   * @return list of team registrations
   */
  List<InscriptionEquipeTournoi> findByEquipe(Equipe equipe);



  /**
   * Finds an existing registration for a team in a tournament.
   *
   * @param tournoi tournament entity
   * @param equipe team entity
   * @return optional registration if found
   */
  Optional<InscriptionEquipeTournoi> findByTournoiAndEquipe(Tournoi tournoi, Equipe equipe);
}
