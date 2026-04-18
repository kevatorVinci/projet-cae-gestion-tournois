package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import lombok.Data;

/**
 * DTO representing one eligible member for lineup selection.
 */
@Data
public class PlayerSelectionMemberDto {
  private Long memberId;
  private String tag;
  private String specialty;
  private String profileImageUrl;
  private boolean selected;
}
