package be.vinci.ipl.cae.demo.models.dtos.unavailability;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/** DTO for returning an unavailability period. */
public record UnavailabilityResponseDto(
    Long id,
    @JsonProperty("dateDebut") LocalDate startDate,
    @JsonProperty("dateFin") LocalDate endDate) {}
