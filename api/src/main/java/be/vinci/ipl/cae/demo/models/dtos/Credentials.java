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
}