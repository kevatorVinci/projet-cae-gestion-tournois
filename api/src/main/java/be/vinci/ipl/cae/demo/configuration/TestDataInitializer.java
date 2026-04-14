package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a minimal dataset for automated testing.
 * Activated only when the "test" Spring profile is active.
 */
@Component
@Profile("test")
public class TestDataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    if (userRepo.count() > 0 || teamRepo.count() > 0 || tournamentRepo.count() > 0) {
      return;
    }

    final String pwd = pwdEncoder.encode("Test1234!");

    User admin = makeUser("admin@test.com", "TestAdmin",
            "tacticien", "2025-01-01", true, pwd, "luffy.png");
    User user = makeUser("user@test.com", "TestUser",
            "exécuteur", "2025-01-01", false, pwd, "miles.jpg");
    User botA1 = makeUser("bota1@test.com", "BotA1",
            "gardien", "2025-01-01", false, pwd, "kaido.png");
    User botA2 = makeUser("bota2@test.com", "BotA2",
            "guérisseur", "2025-01-01", false, pwd, "erza.jpg");
    User botA3 = makeUser("bota3@test.com", "BotA3",
            "catalyseur", "2025-01-01", false, pwd, "itadori.jpg");
    User botB1 = makeUser("botb1@test.com", "BotB1",
            "architecte", "2025-01-01", false, pwd, "flash.jpg");
    User botB2 = makeUser("botb2@test.com", "BotB2",
            "catalyseur", "2025-01-01", false, pwd, "makima.jpg");
    User botB3 = makeUser("botb3@test.com", "BotB3",
            "gardien", "2025-01-01", false, pwd, "neon2.jpg");
    userRepo.saveAll(List.of(admin, user, botA1, botA2, botA3, botB1, botB2, botB3));

    Team teamA = createTeam("TEST_TEAM_A", admin, null, null);

    admin.setTeam(teamA);
    botA1.setTeam(teamA);
    botA2.setTeam(teamA);
    botA3.setTeam(teamA);

    final Team teamB = createTeam("TEST_TEAM_B", user, null, null);

    user.setTeam(teamB);
    botB1.setTeam(teamB);
    botB2.setTeam(teamB);
    botB3.setTeam(teamB);
    userRepo.saveAll(List.of(admin, botA1, botA2, botA3, user, botB1, botB2, botB3));

    Tournament tournament = makeTournament(
            "Test Tournament",
            "Minimal tournament for automated tests",
            LocalDate.now().plusDays(10).toString(),
            LocalDate.now().plusDays(20).toString(),
            LocalDate.now().plusDays(5).toString(),
            "OUVERT", 4);
    tournamentRepo.save(tournament);

    RegistrationTeamTournament reg = new RegistrationTeamTournament();
    reg.setTournament(tournament);
    reg.setTeam(teamA);
    reg.setRegistrationDate(LocalDate.now());
    inscriptionRepo.save(reg);

    System.out.println("[test] DB initialized: 8 users, 2 teams, 1 tournament, 1 registration");
  }
}