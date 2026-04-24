package be.vinci.ipl.cae.demo.models.dtos;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/** Unit tests for Credentials DTO validation logic. */
class CredentialsTest {

  private static Validator validator;

  /** Initializes the validator before running tests. */
  @BeforeAll
  static void setUp() {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    validator = factory.getValidator();
  }

  /** Tests that a strong password passes validation. */
  @Test
  void passwordMotDePasseFortPasseLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setEmail("test@vinci.be");
    credentials.setPassword("SuperPizza!2026");

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);

    assertTrue(violations.isEmpty(), "Le mot de passe devrait être considéré comme valide.");
  }

  /** Tests that a password that is too short fails validation. */
  @Test
  void passwordTropCourtEchoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("A1!aaaa");

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe de 7 caractères devrait être rejeté.");
  }

  /** Tests that a password without uppercase letters fails validation. */
  @Test
  void passwordSansMajusculeEchoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("superpizza!2026");

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe sans majuscule devrait être rejeté.");
  }

  /** Tests that a password without numbers fails validation. */
  @Test
  void passwordSansChiffreEchoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("SuperPizza!");

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe sans chiffre devrait être rejeté.");
  }

  /** Tests that a password without special characters fails validation. */
  @Test
  void passwordSansCaractereSpecialEchoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("SuperPizza2026");

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(
        violations.isEmpty(), "Le mot de passe sans caractère spécial devrait être rejeté.");
  }
}
