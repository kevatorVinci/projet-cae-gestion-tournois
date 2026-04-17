package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.tournament.TeamTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentAbstractDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentTeamRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Mapper component to convert tournament registration entities into various DTOs.
 */
@Component
public class RegisterTeamTournamentMapper {

  /**
   * Converts a registration to a DTO focused on the team info for a tournament view.
   *
   * @param registration the entity to convert.
   * @return the corresponding DTO, or null if input is null.
   */
  public TournamentTeamRegistrationDto toTournoiEquipeInscriptionDto(
          RegistrationTeamTournament registration) {
    if (registration == null) {
      return null;
    }

    return new TournamentTeamRegistrationDto(
            registration.getTeam().getId(),
            registration.getTeam().getName(),
            registration.getTeam().getProfileImage(),
            registration.getRegistrationDate());
  }

  /**
   * Converts a list of registrations to team-focused DTOs.
   *
   * @param registrations an iterable collection of registration entities.
   * @return a list of DTOs.
   */
  public List<TournamentTeamRegistrationDto> toTournoiEquipeInscriptionDtos(
          Iterable<RegistrationTeamTournament> registrations) {
    List<TournamentTeamRegistrationDto> result = new ArrayList<>();
    if (registrations != null) {
      for (RegistrationTeamTournament registration : registrations) {
        result.add(toTournoiEquipeInscriptionDto(registration));
      }
    }
    return result;
  }

  /**
   * Converts a registration to a DTO focused on the tournament info for a team view.
   *
   * @param registration the entity to convert.
   * @return the corresponding DTO, or null if input is null.
   */
  public TeamTournamentRegistrationDto toEquipeTournamentRegistrationDto(
          RegistrationTeamTournament registration) {
    if (registration == null) {
      return null;
    }

    TournamentAbstractDto tournamentDto = new TournamentAbstractDto(
            registration.getTournament().getId(),
            registration.getTournament().getName(),
            registration.getTournament().getStatus(),
            registration.getTournament().getStartDate(),
            registration.getTournament().getMaxParticipants());

    return new TeamTournamentRegistrationDto(
            registration.getTournament().getId(),
            registration.getTeam().getId(),
            registration.getRegistrationDate(),
            tournamentDto);
  }

  /**
   * Converts a list of registrations to tournament-focused DTOs.
   *
   * @param registrations an iterable collection of registration entities.
   * @return a list of DTOs.
   */
  public List<TeamTournamentRegistrationDto> toEquipeTournamentRegistrationDtos(
          Iterable<RegistrationTeamTournament> registrations) {
    List<TeamTournamentRegistrationDto> result = new ArrayList<>();
    if (registrations != null) {
      for (RegistrationTeamTournament registration : registrations) {
        result.add(toEquipeTournamentRegistrationDto(registration));
      }
    }
    return result;
  }
}