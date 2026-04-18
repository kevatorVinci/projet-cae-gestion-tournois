package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultDto;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import org.springframework.stereotype.Component;

/**
 * Mapper for MatchResult entity.
 */
@Component
public class MatchResultMapper {

  /**
   * Converts a MatchResult entity to a MatchResultDto.
   *
   * @param result The result entity.
   * @return The mapped DTO.
   */
  public MatchResultDto toDto(MatchResult result) {
    MatchResultDto dto = new MatchResultDto();

    dto.setMatchId(result.getMatch().getId());
    dto.setScoreTeam1(result.getScoreTeam1());
    dto.setScoreTeam2(result.getScoreTeam2());
    dto.setForfeitTeam1(result.isForfeitTeam1());
    dto.setForfeitTeam2(result.isForfeitTeam2());
    dto.setEncodingDate(result.getEncodingDate());
    dto.setAdminEncoderId(result.getAdminEncoder().getId());
    dto.setValidationStatusTeam1(result.getValidationStatusTeam1());
    dto.setValidationStatusTeam2(result.getValidationStatusTeam2());

    return dto;
  }
}