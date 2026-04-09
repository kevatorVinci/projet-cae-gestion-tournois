package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Credentials DTO.
 */
@Data
@NoArgsConstructor
public class Credentials {

  @NotBlank(message = "L'email est requis")
  @Email(message = "Format d'email invalide")
  private String email;

  // Password policy: min 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1
  // special character
  @NotBlank(message = "Le mot de passe est requis")
  @Pattern(
      regexp =
          "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message = "Le mot de passe doit contenir au moins 8 caractères, "
          + "une majuscule, une minuscule, un chiffre et un caractère spécial.")
  private String password;

  private String tag;
  private String specialty;
  private String profileImage;
  private String oldPassword;

  // Apply the same strict rule for password changes
  @Pattern(
      regexp =
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message = "Le nouveau mot de passe doit contenir au moins 8 caractères, "
          + "une majuscule, une minuscule, un chiffre et un caractère spécial.")
  private String newPassword;
}