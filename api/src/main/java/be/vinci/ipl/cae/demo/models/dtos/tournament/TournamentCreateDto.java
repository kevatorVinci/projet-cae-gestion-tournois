package be.vinci.ipl.cae.demo.models.dtos.tournament;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** DTO for creating a tournament. */
public record TournamentCreateDto(
    @NotBlank @JsonProperty("nom") String name,
    String description,
    @NotNull @JsonProperty("dateDebut") LocalDate startDate,
    @NotNull @JsonProperty("dateFin") LocalDate endDate,
    @NotNull @JsonProperty("dateLimiteInscription") LocalDate registrationDeadline,
    @Min(2) @JsonProperty("nombresParticipantsMax") Integer maxParticipants) {}
