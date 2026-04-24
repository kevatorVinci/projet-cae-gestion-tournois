package be.vinci.ipl.cae.demo.models.dtos.match;

import java.time.LocalDateTime;
import lombok.Data;

/** DTO representing a match result. */
@Data
public class MatchResultDto {
  private Long matchId;
  private int scoreTeam1;
  private int scoreTeam2;
  private boolean isForfeitTeam1;
  private boolean isForfeitTeam2;
  private LocalDateTime encodingDate;
  private Long adminEncoderId;
  private String validationStatusTeam1;
  private String validationStatusTeam2;
  private boolean isDefinitive;
}
