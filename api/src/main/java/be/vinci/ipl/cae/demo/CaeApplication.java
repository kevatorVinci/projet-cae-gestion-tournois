package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application entry point.
 */
@SpringBootApplication
@SuppressWarnings("PMD.UseUtilityClass")
@EnableScheduling
public class CaeApplication {

  /**
   * Application bootstrap.
   *
   * @param args startup args
   */
  public static void main(String[] args) {
    SpringApplication.run(CaeApplication.class, args);
  }
}
