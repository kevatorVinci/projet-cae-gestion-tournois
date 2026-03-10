package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Credentials DTO.
 */
@Data
@NoArgsConstructor
public class Credentials {

  private String email;
  private String password;
  private String tag;
  private String specialty;
  private String profileImage;
  private String oldPassword;
  private String newPassword;
}