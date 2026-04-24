package be.vinci.ipl.cae.demo.exceptions;

/**
 * Exception thrown when a user lacks permission to perform an action. Maps to HTTP 403. Use cases:
 * non-responsible trying to manage team, banned user, etc.
 */
public class ForbiddenException extends RuntimeException {

  /**
   * Creates a ForbiddenException with a message.
   *
   * @param message the error message
   */
  public ForbiddenException(String message) {
    super(message);
  }

  /**
   * Creates a ForbiddenException with a message and cause.
   *
   * @param message the error message
   * @param cause the cause
   */
  public ForbiddenException(String message, Throwable cause) {
    super(message, cause);
  }
}
