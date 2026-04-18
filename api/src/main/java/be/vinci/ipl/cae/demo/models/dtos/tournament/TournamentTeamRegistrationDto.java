package be.vinci.ipl.cae.demo.models.dtos.tournament;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/**
 * Public-facing registration DTO for tournament detail page.
 */
public record TournamentTeamRegistrationDto(
    @JsonProperty("equipeId") Long teamId,
    @JsonProperty("equipeName") String teamName,
    @JsonProperty("equipeProfileImage") String teamProfileImage,
    @JsonProperty("dateInscription") LocalDate registrationDate) {
}