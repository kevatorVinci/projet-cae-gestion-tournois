package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.tournament.TeamTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentAbstractDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentTeamRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RegisterTeamTournamentMapper {

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

  public List<TournamentTeamRegistrationDto> toTournoiEquipeInscriptionDtos(
          Iterable<RegistrationTeamTournament> registrations) {
    List<TournamentTeamRegistrationDto> result = new ArrayList<>();
    for (RegistrationTeamTournament registration : registrations) {
      result.add(toTournoiEquipeInscriptionDto(registration));
    }
    return result;
  }

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

  public List<TeamTournamentRegistrationDto> toEquipeTournamentRegistrationDtos(
          Iterable<RegistrationTeamTournament> registrations) {
    List<TeamTournamentRegistrationDto> result = new ArrayList<>();
    for (RegistrationTeamTournament registration : registrations) {
      result.add(toEquipeTournamentRegistrationDto(registration));
    }
    return result;
  }
}