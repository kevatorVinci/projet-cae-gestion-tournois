package be.vinci.ipl.cae.demo.models.dtos.match;

import lombok.Data;

@Data
public class MatchTeamCreateDto {
    private Long matchId;
    private Long teamId;
}