package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a rich, client-facing demo dataset.
 * Includes the full dev dataset plus extra teams with 4+ members each,
 * and two additional tournaments (one CLOTURE, one BROUILLON).
 * Activated only when the "demo" Spring profile is active.
 */
@Component
@Profile("demo")
public class DemoDataInitializer extends AbstractDataInitializer {

  /**
   * Executes the data initialization for the demo profile.
   *
   * @param args command line arguments
   */
  @Override
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    boolean shouldSeedBase = prepareBaseSeed(pwd);

    if (shouldSeedBase) {
      SeedData data = seedBaseData(pwd);

      Team alpha = data.alpha();
      Team omega = data.omega();

      addBotMember("alphabot@demo.com", "AlphaBot", "architecte", pwd, "neon2.jpg", alpha);
      for (int j = 1; j <= 3; j++) {
        addBotMember("omegabot" + j + "@demo.com",
            "OmegaBot" + j, "gardien", pwd, "kaido.png", omega);
      }
    }

    ensureDemoTournaments();

    System.out.println("[demo] DB initialized/updated: tournois demo vérifiés "
        + "(Tournois supplémentaires ajoutés).");
  }

  /**
   * Ensures the specific demo tournaments are present in the database.
   */
  private void ensureDemoTournaments() {
    Tournament springShowdown = makeTournament(
        "Vinci Spring Showdown 2026",
        "Tournoi clôturé prêt pour la génération du planning des matchs",
        "2026-04-20",
        "2026-05-05",
        "2026-04-09",
        "CLOTURE",
        8
    );

    Tournament summerInvitational = makeTournament(
        "Summer Invitational 2026",
        "Tournoi estival en préparation, pas encore publié",
        "2026-07-01",
        "2026-07-15",
        "2026-06-20",
        "BROUILLON",
        12
    );

    if (tournamentRepo.findByName("Vinci Spring Showdown 2026").isEmpty()) {
      tournamentRepo.save(springShowdown);
    }

    if (tournamentRepo.findByName("Summer Invitational 2026").isEmpty()) {
      tournamentRepo.save(summerInvitational);
    }

    System.out.println(
        "[demo] DB initialized: 2 tournaments (incl. 1 CLOTURE + 1 BROUILLON)"
    );
  }
}