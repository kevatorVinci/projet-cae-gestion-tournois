package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for tournament-team registration persistence operations.
 */
@Repository
public interface InscriptionEquipeTournoiRepository
    extends CrudRepository<RegistrationTeamTournament, Long> {

  /**
   * Finds all registrations for a given tournament.
   *
   * @param tournament tournament entity
   * @return list of tournament registrations
   */
  List<RegistrationTeamTournament> findByTournament(Tournament tournament);

  /**
   * Finds all registrations for a given team.
   *
   * @param team team entity
   * @return list of team registrations
   */
  List<RegistrationTeamTournament> findByTeam(Team team);

  /**
   * Finds an existing registration for a team in a tournament.
   *
   * @param tournament tournament entity
   * @param team       team entity
   * @return optional registration if found
   */
  Optional<RegistrationTeamTournament> findByTournamentAndTeam(
      Tournament tournament, Team team);
}