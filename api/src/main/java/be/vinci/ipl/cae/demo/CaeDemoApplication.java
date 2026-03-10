package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the CAE demo application.
 */
@SpringBootApplication
public final class CaeDemoApplication {

  /**
   * Private constructor to prevent instantiation.
   */
  private CaeDemoApplication() {
  }

  /**
   * Main method to start the Spring Boot application.
   *
   * @param args command line arguments
   */
  public static void main(String[] args) {
    SpringApplication.run(CaeDemoApplication.class, args);
  }
}