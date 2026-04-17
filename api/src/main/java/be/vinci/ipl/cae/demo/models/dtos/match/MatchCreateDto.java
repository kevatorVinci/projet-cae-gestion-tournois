package be.vinci.ipl.cae.demo.models.dtos.match;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for creating a match.
 */
@Data
public class MatchCreateDto {
    private Long tournamentId;
    private int round;
    private LocalDateTime scheduledDateTime;
    private Long adminResponsibleId;
}