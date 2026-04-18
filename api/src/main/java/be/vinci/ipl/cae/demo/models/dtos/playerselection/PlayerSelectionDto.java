package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import lombok.Data;

/**
 * DTO representing a player selection.
 */
@Data
public class PlayerSelectionDto {
  private Long matchId;
  private Long memberId;
  private Long teamId;
}