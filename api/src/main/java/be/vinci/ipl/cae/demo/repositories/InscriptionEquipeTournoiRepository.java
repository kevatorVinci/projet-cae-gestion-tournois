package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/** Repository for tournament-team registration persistence operations. */
@Repository
public interface InscriptionEquipeTournoiRepository
    extends CrudRepository<RegistrationTeamTournament, Long> {

  /**
   * Finds all registrations for a given tournament.
   *
   * @param tournoi tournament entity
   * @return list of tournament registrations
   */
  List<RegistrationTeamTournament> findByTournoi(Tournament tournoi);

  /**
   * Finds all registrations for a given team.
   *
   * @param equipe team entity
   * @return list of team registrations
   */
  List<RegistrationTeamTournament> findByEquipe(Team equipe);

  /**
   * Finds an existing registration for a team in a tournament.
   *
   * @param tournoi tournament entity
   * @param equipe  team entity
   * @return optional registration if found
   */
  Optional<RegistrationTeamTournament> findByTournoiAndEquipe(Tournament tournoi, Team equipe);
}
