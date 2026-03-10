package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the CAE application.
 */
@SpringBootApplication
@SuppressWarnings("PMD.UseUtilityClass")
public class CaeApplication {

  /**
   * Main method to start the Spring Boot application.
   *
   * @param args command line arguments
   */
  public static void main(String[] args) {
    SpringApplication.run(CaeApplication.class, args);
  }
}