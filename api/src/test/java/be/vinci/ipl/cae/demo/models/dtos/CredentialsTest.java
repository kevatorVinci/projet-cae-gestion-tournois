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

class CredentialsTest {

  private static Validator validator;

  @BeforeAll
  static void setUp() {
    // On initialise le validateur de Spring Boot (celui qui lit les @Pattern)
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    validator = factory.getValidator();
  }

  @Test
  void password_motDePasseFort_passeLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setEmail("test@vinci.be");
    credentials.setPassword("SuperPizza!2026"); // 8+ chars, 1 Maj, 1 Min, 1 Chiffre, 1 Spécial

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);

    // Il ne doit y avoir aucune erreur (la liste des violations est vide)
    assertTrue(violations.isEmpty(), "Le mot de passe devrait être considéré comme valide.");
  }

  @Test
  void password_tropCourt_echoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("A1!aaaa"); // 7 caractères seulement

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe de 7 caractères devrait être rejeté.");
  }

  @Test
  void password_sansMajuscule_echoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("superpizza!2026"); // Pas de majuscule

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe sans majuscule devrait être rejeté.");
  }

  @Test
  void password_sansChiffre_echoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("SuperPizza!"); // Pas de chiffre

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(), "Le mot de passe sans chiffre devrait être rejeté.");
  }

  @Test
  void password_sansCaractereSpecial_echoueLaValidation() {
    Credentials credentials = new Credentials();
    credentials.setPassword("SuperPizza2026"); // Pas de caractère spécial

    Set<ConstraintViolation<Credentials>> violations = validator.validate(credentials);
    assertFalse(violations.isEmpty(),
      "Le mot de passe sans caractère spécial devrait être rejeté.");
  }
}