package be.vinci.ipl.cae.demo.models.dtos.team;

import jakarta.validation.constraints.NotBlank;

/** DTO for creating a new team. */
public record TeamCreationDto(@NotBlank String name, String profileImage) {}
