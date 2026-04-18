package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Public-facing registration DTO for tournament detail page.
 */
public record TournamentTeamRegistrationDto(
    @JsonProperty("equipeId") Long teamId,
    @JsonProperty("equipeName") String teamName,
    @JsonProperty("equipeProfileImage") String teamProfileImage,
    @JsonProperty("dateInscription") LocalDate registrationDate) {
}