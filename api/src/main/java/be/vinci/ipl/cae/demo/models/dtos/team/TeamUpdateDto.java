package be.vinci.ipl.cae.demo.models.dtos.team;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for updating a team's profile image.
 */
public record TeamUpdateDto(
  @NotBlank String profileImage
) {
}