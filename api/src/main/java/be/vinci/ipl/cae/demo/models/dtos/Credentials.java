package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing user login or registration credentials.
 */
@Data
@NoArgsConstructor
public class Credentials {

  private String username;
  private String password;
}
