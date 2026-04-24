package be.vinci.ipl.cae.demo.models.dtos.tournament;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/** Team registration DTO used by responsible/team-facing endpoints. */
public record TeamTournamentRegistrationDto(
    @JsonProperty("tournoiId") Long tournamentId,
    @JsonProperty("equipeId") Long teamId,
    @JsonProperty("dateInscription") LocalDate registrationDate,
    @JsonProperty("tournoi") TournamentAbstractDto tournament) {}
