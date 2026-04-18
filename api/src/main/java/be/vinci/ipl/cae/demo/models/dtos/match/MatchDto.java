package be.vinci.ipl.cae.demo.models.dtos.match;

import java.time.LocalDateTime;
import lombok.Data;

/**
 * DTO representing a match.
 */
@Data
public class MatchDto {
  private Long id;
  private Long tournamentId;
  private Long team1Id;
  private Long team2Id;
  private int round;
  private LocalDateTime scheduledDateTime;
  private String status;
  private Long adminResponsibleId;
}