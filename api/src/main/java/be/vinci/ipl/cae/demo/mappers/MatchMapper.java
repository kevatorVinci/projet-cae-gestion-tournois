package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Mapper class to convert Match entities to MatchDtos.
 */
@Component
public class MatchMapper {

  /**
   * Converts a Match entity to a MatchDto.
   *
   * @param match The entity from the database.
   * @return The DTO for the frontend.
   */
  public MatchDto toDto(Match match) {
    MatchDto dto = new MatchDto();
    if (match == null) {
      return dto;
    }

    dto.setId(match.getId());
    dto.setTournamentId(match.getTournament().getId());

    // Checks if team1 exists before mapping its ID
    if (match.getTeam1() != null) {
      dto.setTeam1Id(match.getTeam1().getId());
    }

    // Checks if team2 exists before mapping its ID
    if (match.getTeam2() != null) {
      dto.setTeam2Id(match.getTeam2().getId());
    }

    dto.setRound(match.getRound());
    dto.setScheduledDateTime(match.getScheduledDateTime());
    dto.setStatus(match.getStatus());
    dto.setAdminResponsibleId(match.getAdminResponsible().getId());

    return dto;
  }

  /**
   * Converts many Match entities to DTOs.
   *
   * @param matches the matches to convert.
   * @return the DTO list.
   */
  public List<MatchDto> toDtos(Iterable<Match> matches) {
    List<MatchDto> result = new ArrayList<>();
    if (matches != null) {
      for (Match match : matches) {
        result.add(toDto(match));
      }
    }
    return result;
  }
}
