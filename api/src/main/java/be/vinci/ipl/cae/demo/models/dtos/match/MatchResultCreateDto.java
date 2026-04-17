package be.vinci.ipl.cae.demo.models.dtos.match;

import lombok.Data;

/**
 * DTO for creating a match result.
 */
@Data
public class MatchResultCreateDto {
    private int scoreTeam1;
    private int scoreTeam2;
    private boolean isForfeitTeam1;
    private boolean isForfeitTeam2;
    private Long adminEncoderId;
}