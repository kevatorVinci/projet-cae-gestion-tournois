package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Global exception handler for REST endpoints.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Handle ResponseStatusException to return proper JSON error format.
   *
   * @param ex the exception
   * @return error response with message
   */
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
    String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
    ErrorResponse errorResponse = new ErrorResponse(message, ex.getStatusCode().value());
    return new ResponseEntity<>(errorResponse, ex.getStatusCode());
  }

  /**
   * Handle validation exceptions.
   *
   * @param ex the exception
   * @return error response with message
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException(
      MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldError().getDefaultMessage();
    ErrorResponse errorResponse = new ErrorResponse(message, HttpStatus.BAD_REQUEST.value());
    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
  }
}
