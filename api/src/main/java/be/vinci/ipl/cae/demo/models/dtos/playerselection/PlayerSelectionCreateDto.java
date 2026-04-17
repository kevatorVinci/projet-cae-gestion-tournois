package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import lombok.Data;

/**
 * DTO for creating a player selection.
 */
@Data
public class PlayerSelectionCreateDto {
    private Long matchId;
    private Long memberId;
    private Long teamId;
}