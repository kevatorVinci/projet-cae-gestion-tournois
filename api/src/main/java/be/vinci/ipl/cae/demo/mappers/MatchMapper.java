package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import org.springframework.stereotype.Component;

/**
 * Mapper class to convert Match entities to MatchDtos.
 */
@Component
public class MatchMapper {

    /**
     * Converts a Match entity to a MatchDto.
     * @param match The entity from the database.
     * @return The DTO for the frontend.
     */
    public MatchDto toDto(Match match) {
        MatchDto dto = new MatchDto();
        dto.setId(match.getId()); // Copies the unique identifier
        dto.setTournamentId(match.getTournament().getId()); // Gets the ID from the Tournament entity

        // Checks if team1 is not null before getting its ID
        if (match.getTeam1() != null) {
            dto.setTeam1Id(match.getTeam1().getId());
        }

        // Checks if team2 is not null before getting its ID
        if (match.getTeam2() != null) {
            dto.setTeam2Id(match.getTeam2().getId());
        }

        dto.setRound(match.getRound()); // Copies the round number
        dto.setScheduledDateTime(match.getScheduledDateTime()); // Copies the match time
        dto.setStatus(match.getStatus()); // Copies the status string
        dto.setAdminResponsibleId(match.getAdminResponsible().getId()); // Gets the admin ID

        return dto;
    }
}