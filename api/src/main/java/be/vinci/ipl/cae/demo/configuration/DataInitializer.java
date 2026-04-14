package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Configuration;

/**
 * Component to initialize the database with demo data.
 */
@Configuration
public class DataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    if (prepareBaseSeed(pwdEncoder.encode("Azerty2026!"))) {
      seedBaseData(pwdEncoder.encode("Azerty2026!"));
      System.out.println("Base de données par défaut initialisée !");
    }
  }
}