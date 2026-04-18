package be.vinci.ipl.cae.demo.models.dtos.tournament;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

/**
 * DTO for updating a tournament.
 */
public record TournamentUpdateDto(
    @JsonProperty("nom") String name,
    String description,
    @JsonProperty("dateDebut") LocalDate startDate,
    @JsonProperty("dateFin") LocalDate endDate,
    @JsonProperty("dateLimiteInscription") LocalDate registrationDeadline,
    @Min(2) @JsonProperty("nombresParticipantsMax") Integer maxParticipants) {
}
