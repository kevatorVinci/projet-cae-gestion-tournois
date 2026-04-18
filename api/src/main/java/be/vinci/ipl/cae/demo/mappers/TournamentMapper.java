package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.team.TeamReferenceDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentResponseDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentUpdateDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import org.springframework.stereotype.Component;

/**
 * Mapper for tournament DTO conversions.
 */
@Component
public class TournamentMapper {

  /**
   * Converts a tournament entity to a response DTO.
   *
   * @param tournament the tournament entity.
   * @return the corresponding response DTO.
   */
  public TournamentResponseDto toDto(Tournament tournament) {
    if (tournament == null) {
      return null;
    }

    return new TournamentResponseDto(
        tournament.getId(),
        tournament.getName(),
        tournament.getDescription(),
        tournament.getStartDate(),
        tournament.getEndDate(),
        tournament.getRegistrationDeadline(),
        tournament.getStatus(),
        tournament.getMaxParticipants(),
        tournament.isMatchSchedulePublished(),
        toTeamReferenceDto(tournament.getWinner()));
  }

  /**
   * Converts a create DTO to a tournament entity.
   *
   * @param dto the creation payload.
   * @return the tournament entity.
   */
  public Tournament toEntity(TournamentCreateDto dto) {
    Tournament tournament = new Tournament();
    if (dto == null) {
      return tournament;
    }

    tournament.setName(dto.name());
    tournament.setDescription(dto.description());
    tournament.setStartDate(dto.startDate());
    tournament.setEndDate(dto.endDate());
    tournament.setRegistrationDeadline(dto.registrationDeadline());
    tournament.setMaxParticipants(dto.maxParticipants());
    return tournament;
  }

  /**
   * Converts an update DTO to a tournament entity.
   *
   * @param dto the update payload.
   * @return the tournament entity.
   */
  public Tournament toEntity(TournamentUpdateDto dto) {
    Tournament tournament = new Tournament();
    if (dto == null) {
      return tournament;
    }

    tournament.setName(dto.name());
    tournament.setDescription(dto.description());
    tournament.setStartDate(dto.startDate());
    tournament.setEndDate(dto.endDate());
    tournament.setRegistrationDeadline(dto.registrationDeadline());
    tournament.setMaxParticipants(dto.maxParticipants());
    return tournament;
  }

  /**
   * Applies update DTO values to an existing tournament entity.
   *
   * @param tournament the target tournament entity.
   * @param dto the update payload.
   */
  public void applyUpdate(Tournament tournament, TournamentUpdateDto dto) {
    if (tournament == null || dto == null) {
      return;
    }

    if (dto.name() != null) {
      tournament.setName(dto.name());
    }
    if (dto.description() != null) {
      tournament.setDescription(dto.description());
    }
    if (dto.startDate() != null) {
      tournament.setStartDate(dto.startDate());
    }
    if (dto.endDate() != null) {
      tournament.setEndDate(dto.endDate());
    }
    if (dto.registrationDeadline() != null) {
      tournament.setRegistrationDeadline(dto.registrationDeadline());
    }
    if (dto.maxParticipants() != null) {
      tournament.setMaxParticipants(dto.maxParticipants());
    }
  }

  private TeamReferenceDto toTeamReferenceDto(Team team) {
    if (team == null) {
      return null;
    }
    return new TeamReferenceDto(team.getId(), team.getName());
  }
}
