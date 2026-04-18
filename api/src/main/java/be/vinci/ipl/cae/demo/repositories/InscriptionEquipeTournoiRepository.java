package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for tournament-team registration persistence operations.
 */
@Repository
public interface InscriptionEquipeTournoiRepository
    extends CrudRepository<RegistrationTeamTournament, Long> {

  /**
   * Finds all registrations for a given tournament.
   *
   * @param tournament the tournament entity.
   * @return the list of tournament registrations.
   */
  List<RegistrationTeamTournament> findByTournament(Tournament tournament);

  /**
   * Finds all registrations for a given team.
   *
   * @param team the team entity.
   * @return the list of team registrations.
   */
  List<RegistrationTeamTournament> findByTeam(Team team);

  /**
   * Finds an existing registration for a team in a tournament.
   *
   * @param tournament the tournament entity.
   * @param team       the team entity.
   * @return an optional registration if found.
   */
  Optional<RegistrationTeamTournament> findByTournamentAndTeam(
      Tournament tournament, Team team);
}