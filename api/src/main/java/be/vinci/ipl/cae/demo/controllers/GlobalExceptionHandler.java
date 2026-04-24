package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.exceptions.BadRequestException;
import be.vinci.ipl.cae.demo.exceptions.ConflictException;
import be.vinci.ipl.cae.demo.exceptions.ForbiddenException;
import be.vinci.ipl.cae.demo.exceptions.NotFoundException;
import be.vinci.ipl.cae.demo.models.dtos.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Global exception handler for REST endpoints. Centralizes all exception handling to return
 * consistent error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Handle custom NotFoundException.
   *
   * @param ex the exception
   * @return error response with HTTP 404
   */
  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
    ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND.value());
    return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
  }

  /**
   * Handle custom ConflictException.
   *
   * @param ex the exception
   * @return error response with HTTP 409
   */
  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
    ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), HttpStatus.CONFLICT.value());
    return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
  }

  /**
   * Handle custom ForbiddenException.
   *
   * @param ex the exception
   * @return error response with HTTP 403
   */
  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
    ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN.value());
    return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
  }

  /**
   * Handle custom BadRequestException.
   *
   * @param ex the exception
   * @return error response with HTTP 400
   */
  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
    ErrorResponse errorResponse =
        new ErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
  }

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
