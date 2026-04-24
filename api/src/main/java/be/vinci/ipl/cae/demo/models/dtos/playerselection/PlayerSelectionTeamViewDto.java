package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import java.util.List;
import lombok.Data;

/** DTO representing a team's lineup state for one match. */
@Data
public class PlayerSelectionTeamViewDto {
  private Long matchId;
  private Long teamId;
  private boolean canEdit;
  private int maxPlayers;
  private int selectedCount;
  private List<PlayerSelectionMemberDto> members;
}
