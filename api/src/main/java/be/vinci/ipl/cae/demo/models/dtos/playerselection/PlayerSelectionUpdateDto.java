package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import java.util.List;
import lombok.Data;

/**
 * DTO for replacing a team lineup for one match.
 */
@Data
public class PlayerSelectionUpdateDto {
  private List<Long> memberIds;
}
