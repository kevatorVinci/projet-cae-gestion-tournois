package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO spécifique pour la mise à jour du profil. */
@Data
@NoArgsConstructor
public class UpdateProfileDto {

  private String email;
  private String specialty;
  private String profileImage;
  private String oldPassword;

  // Le bouclier est actif UNIQUEMENT sur le nouveau mot de passe !
  // Note : On ne met pas @NotBlank ici, car on a le droit de modifier
  // son avatar SANS changer son mot de passe (donc ça peut être null).
  @Pattern(
      regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
      message = "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
  )
  private String newPassword;
}
