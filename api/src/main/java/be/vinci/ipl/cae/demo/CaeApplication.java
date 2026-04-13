package be.vinci.ipl.cae.demo;

import io.github.cdimascio.dotenv.Dotenv;
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
   * Loads .env variables into system properties, then starts Spring.
   *
   * @param args startup args
   */
  public static void main(String[] args) {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    dotenv.entries().forEach(entry ->
        System.setProperty(entry.getKey(), entry.getValue())
    );
    SpringApplication.run(CaeApplication.class, args);
  }
}
