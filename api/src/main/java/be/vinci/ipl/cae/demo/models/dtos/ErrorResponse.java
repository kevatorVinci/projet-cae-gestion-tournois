package be.vinci.ipl.cae.demo.models.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO for error responses. */
@Data
@NoArgsConstructor
public class ErrorResponse {

  private String message;
  private int status;

  /**
   * Creates an error response with message and HTTP status code.
   *
   * @param message the error message.
   * @param status the HTTP status code.
   */
  public ErrorResponse(String message, int status) {
    this.message = message;
    this.status = status;
  }
}
