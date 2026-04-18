package be.vinci.ipl.cae.demo.models.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for banning a user.
 */
public record BanUserDto(
    @NotBlank @Email String email,
    String reason) {
}
