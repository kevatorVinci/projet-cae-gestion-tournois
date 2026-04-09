package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.tournament.TeamTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentAbstractDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentTeamRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for tournament registration DTO conversions. */
@Component
public class RegisterTeamTournamentMapper {

  /** Converts one inscription into the public tournament team inscription DTO. */
  public TournamentTeamRegistrationDto toTournoiEquipeInscriptionDto(
      RegistrationTeamTournament inscription) {
    if (inscription == null) {
      return null;
    }

    return new TournamentTeamRegistrationDto(
        inscription.getEquipe().getId(),
        inscription.getEquipe().getName(),
        inscription.getEquipe().getProfileImage(),
        inscription.getDateInscription());
  }

  /**
   * Converts multiple inscriptions to public tournament team inscription DTOs.
   */
  public List<TournamentTeamRegistrationDto> toTournoiEquipeInscriptionDtos(
      Iterable<RegistrationTeamTournament> inscriptions) {
    List<TournamentTeamRegistrationDto> result = new ArrayList<>();
    for (RegistrationTeamTournament inscription : inscriptions) {
      result.add(toTournoiEquipeInscriptionDto(inscription));
    }
    return result;
  }

  /** Converts one inscription to the team registration DTO. */
  public TeamTournamentRegistrationDto toEquipeTournamentRegistrationDto(
      RegistrationTeamTournament inscription) {
    if (inscription == null) {
      return null;
    }

    TournamentAbstractDto tournoi = new TournamentAbstractDto(
        inscription.getTournoi().getId(),
        inscription.getTournoi().getNom(),
        inscription.getTournoi().getEtat(),
        inscription.getTournoi().getDateDebut(),
        inscription.getTournoi().getNombresParticipantsMax());

    return new TeamTournamentRegistrationDto(
        inscription.getTournoi().getId(),
        inscription.getEquipe().getId(),
        inscription.getDateInscription(),
        tournoi);
  }

  /** Converts multiple inscriptions to team registration DTOs. */
  public List<TeamTournamentRegistrationDto> toEquipeTournamentRegistrationDtos(
      Iterable<RegistrationTeamTournament> inscriptions) {
    List<TeamTournamentRegistrationDto> result = new ArrayList<>();
    for (RegistrationTeamTournament inscription : inscriptions) {
      result.add(toEquipeTournamentRegistrationDto(inscription));
    }
    return result;
  }
}
