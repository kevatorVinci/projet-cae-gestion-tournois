package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    String devPwd = pwdEncoder.encode("Azerty2026!");

    // Seed base data (teams, users, etc.)
    SeedData data = null;
    if (prepareBaseSeed(devPwd)) {
      data = seedBaseData(devPwd);
    }

    // If base data was seeded, we can safely create our test tournament
    if (data != null) {
      createForfeitTestTournament(data);
    }

    System.out.println("Base de données DEV vérifiée.");
  }

  /**
   * Creates a small 4-team tournament in progress to test the "déclarer forfait" feature.
   */
  private void createForfeitTestTournament(SeedData data) {

    // Avoid duplicates if the dev DB is reused
    if (tournamentRepo.findByName("Forfeit").isPresent()) {
      System.out.println("[dev] Tournoi 'Forfeit' déjà présent.");
      return;
    }

    // Select 4 teams deterministically
    List<Team> fourTeams = List.of(
        data.alpha(),
        data.omega(),
        data.iota(),
        data.dummyTeams().get(0)
    );

    // Create the tournament
    Tournament forfeitTournament = makeTournament(
        "Forfeit",
        "Tournoi de test pour la fonctionnalité de forfait",
        "2026-04-01",   
        "2026-05-31",   
        "2026-04-25",   
        "EN_COURS",     
        4               
    );

    forfeitTournament = tournamentRepo.save(forfeitTournament);

    registerTeams(forfeitTournament, fourTeams, "2026-05-01");

    System.out.println("[dev] Tournoi 'Forfeit' créé avec 4 équipes pour tester le forfait.");
  }
}
