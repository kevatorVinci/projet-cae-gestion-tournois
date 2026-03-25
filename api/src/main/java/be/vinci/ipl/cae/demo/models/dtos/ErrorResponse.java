package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO pour les réponses d'erreur. */
@Data
@NoArgsConstructor
public class ErrorResponse {
  private String message;
  private int status;

  public ErrorResponse(String message, int status) {
    this.message = message;
    this.status = status;
  }
}
