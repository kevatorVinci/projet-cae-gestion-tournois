package be.vinci.ipl.cae.demo.exceptions;

/**
 * Exception thrown when a requested resource is not found.
 * Maps to HTTP 404.
 */
public class NotFoundException extends RuntimeException {

  /**
   * Creates a NotFoundException with a message.
   *
   * @param message the error message
   */
  public NotFoundException(String message) {
    super(message);
  }

  /**
   * Creates a NotFoundException with a message and cause.
   *
   * @param message the error message
   * @param cause   the cause
   */
  public NotFoundException(String message, Throwable cause) {
    super(message, cause);
  }
}
