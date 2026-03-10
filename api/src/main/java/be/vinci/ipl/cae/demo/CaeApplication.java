package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@SuppressWarnings("PMD.UseUtilityClass")
/** Main Spring Boot application entry point. */
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
