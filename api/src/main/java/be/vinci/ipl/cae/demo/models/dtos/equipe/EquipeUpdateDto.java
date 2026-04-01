package be.vinci.ipl.cae.demo.models.dtos.equipe;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for updating a team's profile image.
 */
public record EquipeUpdateDto(
        @NotBlank String profileImage
) {}