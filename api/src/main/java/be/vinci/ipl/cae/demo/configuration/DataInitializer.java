package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

/** Seeds only the base dataset for non-demo profiles. */
@Configuration
@Profile("!demo")
public class DataInitializer extends AbstractDataInitializer {

  @Override
  @Transactional
  public void run(String... args) {
    if (prepareBaseSeed(pwdEncoder.encode("Azerty2026!"))) {
      seedBaseData(pwdEncoder.encode("Azerty2026!"));
      System.out.println("Base de données initialisée avec succès (Hors Démo) !");
    }
  }
}
