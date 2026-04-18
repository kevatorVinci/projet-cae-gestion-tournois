package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a dataset for the development environment.
 */
@Component
@Profile("dev")
public class DevDataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    String devPwd = pwdEncoder.encode("Azerty2026!");
    if (prepareBaseSeed(devPwd)) {
      seedBaseData(devPwd);
    }
    ensureMatchHistory();
    System.out.println("Base de données DEV vérifiée.");
  }
}