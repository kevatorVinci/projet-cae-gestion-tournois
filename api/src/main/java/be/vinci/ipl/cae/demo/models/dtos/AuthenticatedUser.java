package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * DTO for authenticated user with JWT token.
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
public class AuthenticatedUser {

  private String username;
  private String token;
}

