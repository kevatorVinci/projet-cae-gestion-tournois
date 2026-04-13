package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a minimal dataset for automated testing.
 * Activated only when the "test" Spring profile is active.
 */
@Component
@Profile("test")
public class TestDataInitializer implements CommandLineRunner {

  private final TeamRepository teamRepo;
  private final TournamentRepository tournamentRepo;
  private final InscriptionEquipeTournoiRepository inscriptionRepo;
  private final UserRepository userRepo;
  private final PasswordEncoder pwdEncoder;

  /** Constructor injection. */
  public TestDataInitializer(
      TeamRepository teamRepo,
      TournamentRepository tournamentRepo,
      InscriptionEquipeTournoiRepository inscriptionRepo,
      UserRepository userRepo,
      PasswordEncoder pwdEncoder) {
    this.teamRepo = teamRepo;
    this.tournamentRepo = tournamentRepo;
    this.inscriptionRepo = inscriptionRepo;
    this.userRepo = userRepo;
    this.pwdEncoder = pwdEncoder;
  }

  @Override
  public void run(String... args) {
    if (userRepo.count() > 0 || teamRepo.count() > 0 || tournamentRepo.count() > 0) {
      return;
    }

    final String pwd = pwdEncoder.encode("Test1234!");

    // 1 admin + 1 regular user
    User admin = makeUser("admin@test.com", "TestAdmin", "tacticien", true, pwd, "luffy.png");
    User user = makeUser("user@test.com", "TestUser", "exécuteur", false, pwd, "miles.jpg");
    userRepo.saveAll(List.of(admin, user));

    // 4 bot users to fill teams to 4+ members
    User botA1 = makeUser("bota1@test.com", "BotA1", "gardien", false, pwd, "kaido.png");
    User botA2 = makeUser("bota2@test.com", "BotA2", "guérisseur", false, pwd, "erza.jpg");
    User botB1 = makeUser("botb1@test.com", "BotB1", "architecte", false, pwd, "flash.jpg");
    User botB2 = makeUser("botb2@test.com", "BotB2", "catalyseur", false, pwd, "makima.jpg");
    userRepo.saveAll(List.of(botA1, botA2, botB1, botB2));

    // 2 teams, each with 4 members
    Team teamA = new Team();
    teamA.setName("TEST_TEAM_A");
    teamA.setResponsablePrincipal(admin);
    teamRepo.save(teamA);

    Team teamB = new Team();
    teamB.setName("TEST_TEAM_B");
    teamB.setResponsablePrincipal(user);
    teamRepo.save(teamB);

    admin.setEquipe(teamA);
    botA1.setEquipe(teamA);
    botA2.setEquipe(teamA);
    user.setEquipe(teamB);
    botB1.setEquipe(teamB);
    botB2.setEquipe(teamB);

    // Extra bots to reach 4 members per team
    User botA3 = makeUser("bota3@test.com", "BotA3", "catalyseur", false, pwd, "itadori.jpg");
    User botB3 = makeUser("botb3@test.com", "BotB3", "gardien", false, pwd, "neon2.jpg");
    userRepo.saveAll(List.of(botA3, botB3));
    botA3.setEquipe(teamA);
    botB3.setEquipe(teamB);
    userRepo.saveAll(List.of(admin, botA1, botA2, botA3, user, botB1, botB2, botB3));

    // 1 tournament (OUVERT, future dates)
    Tournament tournament = new Tournament();
    tournament.setNom("Test Tournament");
    tournament.setDescription("Minimal tournament for automated tests");
    tournament.setDateDebut(LocalDate.now().plusDays(10));
    tournament.setDateFin(LocalDate.now().plusDays(20));
    tournament.setDateLimiteInscription(LocalDate.now().plusDays(5));
    tournament.setEtat("OUVERT");
    tournament.setNombresParticipantsMax(4);
    tournamentRepo.save(tournament);

    // 1 registration: TEST_TEAM_A in the tournament
    RegistrationTeamTournament reg = new RegistrationTeamTournament();
    reg.setTournoi(tournament);
    reg.setEquipe(teamA);
    reg.setDateInscription(LocalDate.now());
    inscriptionRepo.save(reg);

    System.out.println("[test] DB initialized: 8 users, 2 teams, 1 tournament, 1 registration");
  }

  private User makeUser(String email, String tag, String spec,
      boolean admin, String pwd, String img) {
    User u = new User();
    u.setEmail(email);
    u.setTag(tag);
    u.setSpecialty(spec);
    u.setCreationDate(LocalDate.now());
    u.setAdmin(admin);
    u.setPassword(pwd);
    u.setProfileImageUrl(img);
    return u;
  }
}
