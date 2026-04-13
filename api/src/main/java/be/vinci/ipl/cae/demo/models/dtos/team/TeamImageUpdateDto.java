package be.vinci.ipl.cae.demo.models.dtos.team;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for updating a team's profile image.
 */
public record TeamImageUpdateDto(
  @NotBlank String profileImage) {
}