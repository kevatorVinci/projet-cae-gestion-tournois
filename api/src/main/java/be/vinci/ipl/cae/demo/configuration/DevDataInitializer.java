package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a rich development dataset.
 * Activated only when the "dev" Spring profile is active.
 */
@Component
@Profile("dev")
public class DevDataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    if (!prepareBaseSeed(pwd)) {
      return;
    }

    seedBaseData(pwd);

    System.out.println("[dev] DB initialized: 8 users, 16 teams, 7 tournaments");
  }
}
