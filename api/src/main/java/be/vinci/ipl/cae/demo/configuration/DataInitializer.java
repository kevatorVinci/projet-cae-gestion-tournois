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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Component to initialize the database with demo data.
 */
@Configuration
public class DataInitializer {

  /**
   * Helper to create a user.
   */
  private User makeUser(
    String email, String tag, String spec, String date,
    boolean admin, String pwd, String img) {
    User u = new User();
    u.setEmail(email);
    u.setTag(tag);
    u.setSpecialty(spec);
    u.setCreationDate(LocalDate.parse(date));
    u.setAdmin(admin);
    u.setPassword(pwd);
    u.setProfileImageUrl(img);
    return u;
  }

  /**
   * Helper to create a tournament.
   */
  private Tournament makeTournament(
    String name, String desc, String start, String end, String limit,
    String status, int maxTeams) {
    Tournament t = new Tournament();
    t.setName(name);
    t.setDescription(desc);
    t.setStartDate(LocalDate.parse(start));
    t.setEndDate(LocalDate.parse(end));
    t.setRegistrationDeadline(LocalDate.parse(limit));
    t.setStatus(status);
    t.setMaxParticipants(maxTeams);
    return t;
  }

  /**
   * Helper to register multiple teams to a tournament.
   */
  private void registerTeams(
    InscriptionEquipeTournoiRepository repo, Tournament tournament,
    List<Team> teams, String date) {
    LocalDate d = LocalDate.parse(date);
    for (Team eq : teams) {
      RegistrationTeamTournament ins = new RegistrationTeamTournament();
      ins.setTournament(tournament);
      ins.setTeam(eq);
      ins.setRegistrationDate(d);
      repo.save(ins);
    }
  }

  /**
   * Main bean to init data.
   */
  @Bean
  public CommandLineRunner initDatabase(
    TeamRepository teamRepo, TournamentRepository tournoiRepo,
    InscriptionEquipeTournoiRepository inscriptionRepo,
    UserRepository userRepo, PasswordEncoder pwdEncoder) {
    return args -> {
      final String pwd = pwdEncoder.encode("Azerty2026!");

      if (userRepo.count() > 0) {
        for (User u : userRepo.findAll()) {
          u.setPassword(pwd);
          userRepo.save(u);
        }
        return;
      }
      if (teamRepo.count() > 0 || tournoiRepo.count() > 0) {
        return;
      }

      User lea = makeUser(
        "lea@mail.com", "Lynx", "tacticien", "2025-11-12", true, pwd, "luffy.png");
      User tom = makeUser(
        "tom@mail.com", "Rogue", "exécuteur", "2025-12-03", false, pwd, "miles.jpg");
      User ines = makeUser(
        "ines@mail.com", "Pulse", "guérisseur", "2026-01-18", false, pwd, "erza.jpg");
      User tibo = makeUser(
        "tibo@mail.com", "Iron", "gardien", "2025-10-27", true, pwd, "kaido.png");
      User lisa = makeUser(
        "lisa@mail.com", "Storm", "exécuteur", "2026-01-10", false, pwd, "flash.jpg");
      User noa = makeUser(
        "noa@mail.com", "Flash", "architecte", "2026-02-02", false, pwd, "Pessi.jpg");
      User tim = makeUser(
        "tim@mail.com", "Titi", "gardien", "2026-02-03", false, pwd, "itadori.jpg");
      User zoe = makeUser(
        "zoe@mail.com", "Vector", "catalyseur", "2026-02-04", false, pwd, "makima.jpg");
      userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

      Tournament springArena = makeTournament(
        "Spring Arena Cup 2025", "Compétition printanière", "2025-04-15",
        "2025-04-25", "2025-04-10", "TERMINE", 8);
      Tournament elite2025 = makeTournament(
        "Elite Championship 2025", "Compétition élite", "2025-05-15",
        "2025-05-30", "2025-05-11", "TERMINE", 8);
      Tournament summerPro = makeTournament(
        "Summer Pro League 2025", "Tournoi estival", "2025-07-01",
        "2025-07-15", "2025-06-25", "TERMINE", 16);
      Tournament winterClash = makeTournament(
        "Vinci Winter Clash 2026", "Tournoi hivernal", "2026-01-10",
        "2026-01-20", "2026-01-05", "TERMINE", 12);
      Tournament springBattle = makeTournament(
        "Spring Battle Series 2026", "Série printanière", "2026-04-04",
        "2026-04-11", "2026-04-01", "EN_COURS", 8);
      Tournament easterCup = makeTournament(
        "Vinci Easter Cup 2026", "Tournoi de Pâques", "2026-04-15",
        "2025-04-25", "2026-04-08", "OUVERT", 8);
      Tournament elite2026 = makeTournament(
        "Elite Championship 2026", "Compétition élite", "2026-05-15",
        "2026-05-30", "2026-05-11", "OUVERT", 16);

      tournoiRepo.saveAll(List.of(
        springArena, elite2025, summerPro, winterClash, springBattle, easterCup, elite2026));

      Team alpha = new Team();
      alpha.setName("TEAM_ALPHA");
      alpha.setPrimaryResponsible(lea);
      alpha.setProfileImage("akatsuki.jpg");
      teamRepo.save(alpha);

      Team omega = new Team();
      omega.setName("TEAM_OMEGA");
      omega.setPrimaryResponsible(tibo);
      omega.setProfileImage("espada.jpg");
      teamRepo.save(omega);

      Team iota = new Team();
      iota.setName("TEAM_IOTA");
      iota.setPrimaryResponsible(lisa);
      iota.setSecondaryResponsible(noa);
      iota.setProfileImage("fairytail.jpg");
      teamRepo.save(iota);

      lea.setTeam(alpha);
      tom.setTeam(alpha);
      ines.setTeam(alpha);
      tibo.setTeam(omega);
      lisa.setTeam(iota);
      noa.setTeam(iota);
      tim.setTeam(iota);
      zoe.setTeam(iota);
      userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

      List<String> names = List.of(
        "TEAM_BETA", "TEAM_GAMMA", "TEAM_DELTA", "TEAM_EPSILON", "TEAM_ZETA",
        "TEAM_THETA", "TEAM_KAPPA", "TEAM_LAMBDA", "TEAM_MU", "TEAM_NU",
        "TEAM_XI", "TEAM_PI", "TEAM_SIGMA");
      List<String> botTags = List.of(
        "Nova", "Raptor", "Blaze", "Echo", "Mantis", "Viper", "Astra", "Cipher",
        "Drift", "Sable", "Orion", "Nyx", "Havoc");
      List<String> botAvatars = List.of(
        "butcher.jpg", "eren.png", "femmecars.jpg", "garou.jpg", "jjk.jpg",
        "lookism.jpg", "neon2.jpg", "pevin.jpg", "pion.jpg", "spiderman2099.jpg",
        "tailong.jpg", "crockmou.jpg", "flash.jpg");
      List<String> teamAvatars = List.of(
        "hunter.jpg", "onepiece.jpg", "akatsuki.jpg", "espada.jpg", "fairytail.jpg");

      List<Team> dum = new ArrayList<>();
      for (int i = 0; i < names.size(); i++) {
        User bot = makeUser(
          botTags.get(i).toLowerCase(Locale.ROOT) + "@demo.com", botTags.get(i),
          "exécuteur", "2025-01-01", false, pwd, botAvatars.get(i % botAvatars.size()));
        userRepo.save(bot);

        Team eq = new Team();
        eq.setName(names.get(i));
        eq.setPrimaryResponsible(bot);
        eq.setProfileImage(teamAvatars.get(i % teamAvatars.size()));
        teamRepo.save(eq);

        bot.setTeam(eq);
        userRepo.save(bot);
        dum.add(eq);
      }

      springArena.setWinner(omega);
      elite2025.setWinner(iota);
      summerPro.setWinner(iota);
      winterClash.setWinner(alpha);
      tournoiRepo.saveAll(List.of(springArena, elite2025, summerPro, winterClash));

      List<Team> t = new ArrayList<>(List.of(omega, iota));
      t.addAll(dum.subList(0, 5));
      registerTeams(inscriptionRepo, springArena, t, "2025-04-08");

      t = new ArrayList<>(List.of(alpha, iota));
      t.addAll(dum.subList(0, 4));
      registerTeams(inscriptionRepo, elite2025, t, "2025-05-09");

      t = new ArrayList<>(List.of(alpha, omega, iota));
      t.addAll(dum.subList(0, 11));
      registerTeams(inscriptionRepo, summerPro, t, "2025-06-20");

      t = new ArrayList<>(List.of(alpha, omega, iota));
      t.addAll(dum.subList(0, 9));
      registerTeams(inscriptionRepo, winterClash, t, "2026-01-03");

      t = new ArrayList<>(List.of(alpha, omega, iota));
      t.addAll(dum.subList(0, 5));
      registerTeams(inscriptionRepo, springBattle, t, "2026-03-28");

      t = new ArrayList<>(List.of(omega));
      t.addAll(dum.subList(0, 6));
      registerTeams(inscriptionRepo, easterCup, t, "2026-04-05");

      t = new ArrayList<>(List.of(alpha, omega, iota));
      t.addAll(dum.subList(0, 11));
      registerTeams(inscriptionRepo, elite2026, t, "2026-05-05");
    };
  }
}