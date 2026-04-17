package be.vinci.ipl.cae.demo.models.dtos.match;

import lombok.Data;

@Data
public class MatchTeamDto {
    private Long id;
    private Long matchId;
    private Long teamId;
}