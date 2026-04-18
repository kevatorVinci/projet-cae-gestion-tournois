package be.vinci.ipl.cae.demo.models.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for admin actions that target a user by email.
 */
public record AdminEmailDto(
    @NotBlank @Email String email) {
}
