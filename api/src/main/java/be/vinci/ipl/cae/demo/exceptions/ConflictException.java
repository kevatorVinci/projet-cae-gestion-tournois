package be.vinci.ipl.cae.demo.exceptions;

/**
 * Exception thrown when a request conflicts with existing data. Maps to HTTP 409. Use cases:
 * duplicate tag in team, team name already exists, etc.
 */
public class ConflictException extends RuntimeException {

  /**
   * Creates a ConflictException with a message.
   *
   * @param message the error message
   */
  public ConflictException(String message) {
    super(message);
  }

  /**
   * Creates a ConflictException with a message and cause.
   *
   * @param message the error message
   * @param cause the cause
   */
  public ConflictException(String message, Throwable cause) {
    super(message, cause);
  }
}
