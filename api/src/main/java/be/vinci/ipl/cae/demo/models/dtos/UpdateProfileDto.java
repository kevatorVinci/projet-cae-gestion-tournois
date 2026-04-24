package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO dedicated to profile updates. */
@Data
@NoArgsConstructor
public class UpdateProfileDto {

  private String email;
  private String specialty;
  private String profileImage;
  private String oldPassword;

  /**
   * Validation is applied ONLY to the new password. Note: no @NotBlank here because users can
   * update profile image without changing their password (so this field can be null).
   */
  @Pattern(
      regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message =
          "Le nouveau mot de passe doit contenir au moins 8 caractères, "
              + "une majuscule, une minuscule, un chiffre et un caractère spécial.")
  private String newPassword;
}
