package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO pour les réponses d'erreur. */
@Data
@NoArgsConstructor
public class ErrorResponse {
  private String message;
  private int status;

  /** Creates an error response with message and HTTP status code. */
  public ErrorResponse(String message, int status) {
    this.message = message;
    this.status = status;
  }
}
