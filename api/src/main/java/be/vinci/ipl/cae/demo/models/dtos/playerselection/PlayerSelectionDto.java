package be.vinci.ipl.cae.demo.models.dtos.playerselection;

import lombok.Data;

@Data
public class PlayerSelectionDto {
    private Long matchId;
    private Long memberId;
    private Long teamId;
}