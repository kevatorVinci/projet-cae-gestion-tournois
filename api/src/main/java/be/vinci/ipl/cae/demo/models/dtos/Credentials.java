package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Credentials DTO. */
@Data
@NoArgsConstructor
public class Credentials {

  @NotBlank(message = "L'email est requis")
  @Email(message = "Format d'email invalide")
  private String email;

  // Regex : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
  @NotBlank(message = "Le mot de passe est requis")
  @Pattern(
      regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
  )
  private String password;

  private String tag;
  private String specialty;
  private String profileImage;
  private String oldPassword;

  // On applique la même règle stricte pour le changement de mot de passe
  @Pattern(
      regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message = "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
  )
  private String newPassword;
  
}