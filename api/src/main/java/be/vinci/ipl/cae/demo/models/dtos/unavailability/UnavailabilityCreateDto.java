package be.vinci.ipl.cae.demo.models.dtos.unavailability;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** DTO for creating an unavailability period. */
public record UnavailabilityCreateDto(@NotNull LocalDate startDate, @NotNull LocalDate endDate) {}
