package be.vinci.ipl.cae.demo.exceptions;

/**
 * Exception thrown when a request contains invalid data.
 * Maps to HTTP 400.
 * Use cases: invalid score, empty string, null required field, etc.
 */
public class BadRequestException extends RuntimeException {

  /**
   * Creates a BadRequestException with a message.
   *
   * @param message the error message
   */
  public BadRequestException(String message) {
    super(message);
  }

  /**
   * Creates a BadRequestException with a message and cause.
   *
   * @param message the error message
   * @param cause   the cause
   */
  public BadRequestException(String message, Throwable cause) {
    super(message, cause);
  }
}
