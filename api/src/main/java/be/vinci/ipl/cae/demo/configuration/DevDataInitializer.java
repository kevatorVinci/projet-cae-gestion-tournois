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
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a rich development dataset.
 * Activated only when the "dev" Spring profile is active.
 */
@Component
@Profile("dev")
public class DevDataInitializer implements CommandLineRunner {

  private final TeamRepository equipeRepo;
  private final TournamentRepository tournoiRepo;
  private final InscriptionEquipeTournoiRepository inscriptionRepo;
  private final UserRepository userRepo;
  private final PasswordEncoder pwdEncoder;

  /** Constructor injection. */
  public DevDataInitializer(
      TeamRepository equipeRepo,
      TournamentRepository tournoiRepo,
      InscriptionEquipeTournoiRepository inscriptionRepo,
      UserRepository userRepo,
      PasswordEncoder pwdEncoder) {
    this.equipeRepo = equipeRepo;
    this.tournoiRepo = tournoiRepo;
    this.inscriptionRepo = inscriptionRepo;
    this.userRepo = userRepo;
    this.pwdEncoder = pwdEncoder;
  }

  @Override
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    if (userRepo.count() > 0) {
      for (User u : userRepo.findAll()) {
        u.setPassword(pwd);
        userRepo.save(u);
      }
      return;
    }
    if (equipeRepo.count() > 0 || tournoiRepo.count() > 0) {
      return;
    }

    // 8 real users
    User lea = makeUser("lea@mail.com", "Lynx",
        "tacticien", "2025-11-12", true, pwd, "luffy.png");
    User tom = makeUser("tom@mail.com", "Rogue",
        "exécuteur", "2025-12-03", false, pwd, "miles.jpg");
    User ines = makeUser("ines@mail.com", "Pulse",
        "guérisseur", "2026-01-18", false, pwd, "erza.jpg");
    User tibo = makeUser("tibo@mail.com", "Iron",
        "gardien", "2025-10-27", true, pwd, "kaido.png");
    User lisa = makeUser("lisa@mail.com", "Storm",
        "exécuteur", "2026-01-10", false, pwd, "flash.jpg");
    User noa = makeUser("noa@mail.com", "Flash",
        "architecte", "2026-02-02", false, pwd, "Pessi.jpg");
    User tim = makeUser("tim@mail.com", "Titi",
        "gardien", "2026-02-03", false, pwd, "itadori.jpg");
    User zoe = makeUser("zoe@mail.com", "Vector",
        "catalyseur", "2026-02-04", false, pwd, "makima.jpg");
    userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

    // 7 tournaments
    Tournament springArena = makeTournoi(
        "Spring Arena Cup 2025",
        "Compétition printanière ouverte aux nouvelles teams",
        "2025-04-15", "2025-04-25", "2025-04-10", "TERMINE", 8);

    Tournament elite2025 = makeTournoi(
        "Elite Championship 2025",
        "Compétition élite réservée aux meilleures teams",
        "2025-05-15", "2025-05-30", "2025-05-11", "TERMINE", 8);

    Tournament summerPro = makeTournoi(
        "Summer Pro League 2025",
        "Tournoi estival de haut niveau avec les meilleures teams",
        "2025-07-01", "2025-07-15", "2025-06-25", "TERMINE", 16);

    Tournament winterClash = makeTournoi(
        "Vinci Winter Clash 2026",
        "Tournoi hivernal réunissant des équipes semi-professionnelles",
        "2026-01-10", "2026-01-20", "2026-01-05", "TERMINE", 12);

    Tournament springBattle = makeTournoi(
        "Spring Battle Series 2026",
        "Série printanière avec élimination directe et forte participation",
        "2026-04-04", "2026-04-11", "2026-04-01", "EN_COURS", 8);

    Tournament easterCup = makeTournoi(
        "Vinci Easter Cup 2026",
        "Tournoi de Pâques ouvert à toutes les teams actives",
        "2026-04-15", "2026-04-25", "2026-04-08", "OUVERT", 8);

    Tournament elite2026 = makeTournoi(
        "Elite Championship 2026",
        "Compétition élite réservée aux meilleures teams",
        "2026-05-15", "2026-05-30", "2026-05-11", "OUVERT", 16);

    tournoiRepo.saveAll(List.of(
        springArena, elite2025, summerPro, winterClash,
        springBattle, easterCup, elite2026));

    // 3 real teams
    Team alpha = new Team();
    alpha.setName("TEAM_ALPHA");
    alpha.setResponsablePrincipal(lea);
    alpha.setProfileImage("akatsuki.jpg");
    equipeRepo.save(alpha);

    Team omega = new Team();
    omega.setName("TEAM_OMEGA");
    omega.setResponsablePrincipal(tibo);
    omega.setProfileImage("espada.jpg");
    equipeRepo.save(omega);

    Team iota = new Team();
    iota.setName("TEAM_IOTA");
    iota.setResponsablePrincipal(lisa);
    iota.setResponsableSecondaire(noa);
    iota.setProfileImage("fairytail.jpg");
    equipeRepo.save(iota);

    lea.setEquipe(alpha);
    tom.setEquipe(alpha);
    ines.setEquipe(alpha);
    tibo.setEquipe(omega);
    lisa.setEquipe(iota);
    noa.setEquipe(iota);
    tim.setEquipe(iota);
    zoe.setEquipe(iota);
    userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

    // 13 dummy teams
    List<String> names = List.of(
        "TEAM_BETA", "TEAM_GAMMA", "TEAM_DELTA", "TEAM_EPSILON", "TEAM_ZETA",
        "TEAM_THETA", "TEAM_KAPPA", "TEAM_LAMBDA", "TEAM_MU", "TEAM_NU",
        "TEAM_XI", "TEAM_PI", "TEAM_SIGMA");

    List<String> botTags = List.of(
        "Nova", "Raptor", "Blaze", "Echo", "Mantis", "Viper", "Astra",
        "Cipher", "Drift", "Sable", "Orion", "Nyx", "Havoc");

    List<String> botAvatars = List.of(
        "butcher.jpg", "eren.png", "femmecars.jpg", "garou.jpg", "jjk.jpg",
        "lookism.jpg", "neon2.jpg", "pevin.jpg", "pion.jpg", "spiderman2099.jpg",
        "tailong.jpg", "crockmou.jpg", "flash.jpg");

    List<String> teamAvatars = List.of(
        "hunter.jpg", "onepiece.jpg", "akatsuki.jpg", "espada.jpg", "fairytail.jpg");

    List<Team> dum = new ArrayList<>();
    for (int i = 0; i < names.size(); i++) {
      String name = names.get(i);
      String botTag = botTags.get(i);
      User bot = makeUser(
          botTag.toLowerCase(Locale.ROOT) + "@demo.com",
          botTag, "exécuteur", "2025-01-01", false,
          pwd, botAvatars.get(i % botAvatars.size()));
      userRepo.save(bot);

      Team eq = new Team();
      eq.setName(name);
      eq.setResponsablePrincipal(bot);
      eq.setProfileImage(teamAvatars.get(i % teamAvatars.size()));
      equipeRepo.save(eq);

      bot.setEquipe(eq);
      userRepo.save(bot);
      dum.add(eq);
    }

    // Tournament winners
    springArena.setGagnant(omega);
    elite2025.setGagnant(iota);
    summerPro.setGagnant(iota);
    winterClash.setGagnant(alpha);
    tournoiRepo.saveAll(List.of(springArena, elite2025, summerPro, winterClash));

    // Tournament registrations
    List<Team> t = new ArrayList<>(List.of(omega, iota));
    t.addAll(dum.subList(0, 5));
    inscrire(springArena, t, "2025-04-08");

    t = new ArrayList<>(List.of(alpha, iota));
    t.addAll(dum.subList(0, 4));
    inscrire(elite2025, t, "2025-05-09");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dum.subList(0, 11));
    inscrire(summerPro, t, "2025-06-20");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dum.subList(0, 9));
    inscrire(winterClash, t, "2026-01-03");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dum.subList(0, 5));
    inscrire(springBattle, t, "2026-03-28");

    t = new ArrayList<>(List.of(omega));
    t.addAll(dum.subList(0, 6));
    inscrire(easterCup, t, "2026-04-05");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dum.subList(0, 11));
    inscrire(elite2026, t, "2026-05-05");

    System.out.println("[dev] DB initialized: 8 users, 16 teams, 7 tournaments");
  }

  private User makeUser(String email, String tag,
      String spec, String date, boolean admin,
      String pwd, String img) {
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

  private Tournament makeTournoi(String nom, String desc,
      String debut, String fin, String limiteInscr,
      String etat, int maxTeams) {
    Tournament t = new Tournament();
    t.setNom(nom);
    t.setDescription(desc);
    t.setDateDebut(LocalDate.parse(debut));
    t.setDateFin(LocalDate.parse(fin));
    t.setDateLimiteInscription(LocalDate.parse(limiteInscr));
    t.setEtat(etat);
    t.setNombresParticipantsMax(maxTeams);
    return t;
  }

  private void inscrire(Tournament tournoi, List<Team> teams, String date) {
    LocalDate d = LocalDate.parse(date);
    for (Team eq : teams) {
      RegistrationTeamTournament ins = new RegistrationTeamTournament();
      ins.setTournoi(tournoi);
      ins.setEquipe(eq);
      ins.setDateInscription(d);
      inscriptionRepo.save(ins);
    }
  }
}
