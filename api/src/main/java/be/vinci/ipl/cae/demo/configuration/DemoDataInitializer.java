package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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
@SuppressWarnings("PMD.ExcessiveMethodLength")
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
    SeedData data = null;

    if (shouldSeedBase) {
      data = seedBaseData(pwd);

      Team alpha = data.alpha();
      Team omega = data.omega();

      addBotMember("alphabot@demo.com", "AlphaBot", "architecte", pwd, "neon2.jpg", alpha);
      for (int j = 1; j <= 3; j++) {
        addBotMember("omegabot" + j + "@demo.com",
            "OmegaBot" + j, "gardien", pwd, "kaido.png", omega);
      }
    }

    ensureDemoTournaments(data);
    ensureMatchHistory();

    System.out.println("[demo] DB initialized/updated: tournois demo vérifiés "
        + "(4 tournois CLOTURE supplémentaires en 8/8).");
  }

  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);
    if (registrationTeams.size() < CLOSED_TOURNAMENT_TEAM_CAP) {
      System.out.println("[demo] Impossible de créer les tournois 8/8: "
          + "moins de 8 équipes disponibles.");
      return;
    }

    SeedData data = seedBaseData(pwd);

    Team alpha = data.alpha();
    Team omega = data.omega();

    addBotMember(
        "alphabot@demo.com",
        "AlphaBot",
        "architecte",
        pwd,
        "neon2.jpg",
        alpha
    );

    for (int j = 1; j <= 3; j++) {
      addBotMember(
          "omegabot" + j + "@demo.com",
          "OmegaBot" + j,
          "gardien",
          pwd,
          "kaido.png",
          omega
      );
    }

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

    tournamentRepo.saveAll(List.of(springShowdown, summerInvitational));

    Tournament closedArenaOne = getOrCreateTournament(
        "Demo Closed Arena I",
        "Tournoi de démonstration clôturé (8/8 équipes).",
        "2026-06-01", "2026-06-06", "2026-05-25", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(closedArenaOne, registrationTeams.subList(0, 8), "2026-05-23");

    System.out.println(
        "[demo] DB initialized: users, 16 teams (4+ members),"
        + " 9 tournaments (incl. 1 CLOTURE + 1 BROUILLON)"
    );
  }
}