package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Team registration DTO used by responsible/team-facing endpoints.
 */
public record TeamTournamentRegistrationDto(
    @JsonProperty("tournoiId") Long tournamentId,
    @JsonProperty("equipeId") Long teamId,
    @JsonProperty("dateInscription") LocalDate registrationDate,
    @JsonProperty("tournoi") TournamentAbstractDto tournament) {
}