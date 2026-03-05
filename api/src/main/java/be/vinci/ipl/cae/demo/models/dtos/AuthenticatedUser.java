package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing an authenticated user with a JWT token.
 */
@Data
@NoArgsConstructor
public class AuthenticatedUser {

  private String username;
  private String token;
}
