package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;

/**
 * Abstract Data Transfer Object for tournament information.
 */
public record TournamentAbstractDto(
        Long id,
        String name,
        String status,
        LocalDate startDate,
        Integer maxParticipants) {
}