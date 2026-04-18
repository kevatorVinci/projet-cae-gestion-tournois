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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Shared helper methods for all profile-specific data initializers. Subclasses implement {@link
 * #run} and call these helpers to populate the DB.
 */
public abstract class AbstractDataInitializer implements CommandLineRunner {

  /** The team repository. */
  @Autowired
  protected TeamRepository teamRepo;

  /** The tournament repository. */
  @Autowired
  protected TournamentRepository tournamentRepo;

  /** The inscription repository. */
  @Autowired
  protected InscriptionEquipeTournoiRepository inscriptionRepo;

  /** The user repository. */
  @Autowired
  protected UserRepository userRepo;

  /** The password encoder. */
  @Autowired
  protected PasswordEncoder pwdEncoder;

  /**
   * Creates and returns an unsaved User entity.
   *
   * @param email the email
   * @param tag   the tag
   * @param spec  the specialty
   * @param date  the creation date
   * @param admin true if admin
   * @param pwd   the password
   * @param img   the profile image
   * @return the newly created user
   */
  protected User makeUser(
      String email,
      String tag,
      String spec,
      String date,
      boolean admin,
      String pwd,
      String img) {
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
   * Creates and returns an unsaved Tournament entity.
   *
   * @param name                 the tournament name
   * @param description          the description
   * @param startDate            the start date
   * @param endDate              the end date
   * @param registrationDeadline the registration deadline
   * @param status               the status
   * @param maxParticipants      the max participants
   * @return the tournament entity
   */
  protected Tournament makeTournament(
      String name,
      String description,
      String startDate,
      String endDate,
      String registrationDeadline,
      String status,
      int maxParticipants) {
    Tournament t = new Tournament();
    t.setName(name);
    t.setDescription(description);
    t.setStartDate(LocalDate.parse(startDate));
    t.setEndDate(LocalDate.parse(endDate));
    t.setRegistrationDeadline(LocalDate.parse(registrationDeadline));
    t.setStatus(status);
    t.setMaxParticipants(maxParticipants);
    return t;
  }

  /**
   * Creates, saves, and returns a Team entity.
   *
   * @param name      the name
   * @param principal the principal responsible
   * @param secondary the secondary responsible
   * @param image     the profile image
   * @return the saved team
   */
  protected Team createTeam(String name, User principal, User secondary, String image) {
    Team team = new Team();
    team.setName(name);
    team.setPrimaryResponsible(principal);
    if (secondary != null) {
      team.setSecondaryResponsible(secondary);
    }
    team.setProfileImage(image);
    teamRepo.save(team);
    return team;
  }

  /**
   * Creates, saves, and attaches a bot user to a team.
   *
   * @param email the email
   * @param tag   the tag
   * @param spec  the specialty
   * @param pwd   the password
   * @param img   the image
   * @param team  the team
   * @return the bot user
   */
  protected User addBotMember(
      String email,
      String tag,
      String spec,
      String pwd,
      String img,
      Team team) {
    User bot = makeUser(email, tag, spec, "2025-01-01", false, pwd, img);
    userRepo.save(bot);
    bot.setTeam(team);
    userRepo.save(bot);
    return bot;
  }

  /**
   * Registers each team in the list to the given tournament.
   *
   * @param tournament the tournament
   * @param teams      the teams
   * @param date       the date of registration
   */
  protected void registerTeams(Tournament tournament, List<Team> teams, String date) {
    LocalDate d = LocalDate.parse(date);
    for (Team eq : teams) {
      RegistrationTeamTournament ins = new RegistrationTeamTournament();
      ins.setTournament(tournament);
      ins.setTeam(eq);
      ins.setRegistrationDate(d);
      inscriptionRepo.save(ins);
    }
  }

  /**
   * Updates passwords when users already exist, otherwise checks for empty seed state.
   *
   * @param pwd the default password
   * @return true if database is empty
   */
  protected boolean prepareBaseSeed(String pwd) {
    if (userRepo.count() > 0) {
      for (User u : userRepo.findAll()) {
        u.setPassword(pwd);
        userRepo.save(u);
      }
      return false;
    }
    return teamRepo.count() == 0 && tournamentRepo.count() == 0;
  }

  /**
   * Shared seed used by dev and demo profiles.
   *
   * @param pwd the password
   * @return the seeded data
   */
  @SuppressWarnings("PMD.ExcessiveMethodLength")
  protected SeedData seedBaseData(String pwd) {

    User lea = makeUser("lea@mail.com", "Lynx", "tacticien", "2025-11-12", true, pwd, "luffy.png");
    User tom =
        makeUser("tom@mail.com", "Rogue", "exécuteur", "2025-12-03", false, pwd, "miles.jpg");
    User ines =
        makeUser("ines@mail.com", "Pulse", "guérisseur", "2026-01-18", false, pwd, "erza.jpg");
    User tibo = makeUser("tibo@mail.com", "Iron", "gardien", "2025-10-27", true, pwd, "kaido.png");
    User lisa =
        makeUser("lisa@mail.com", "Storm", "exécuteur", "2026-01-10", false, pwd, "flash.jpg");
    User noa =
        makeUser("noa@mail.com", "Flash", "architecte", "2026-02-02", false, pwd, "Pessi.jpg");
    User tim = makeUser("tim@mail.com", "Titi", "gardien", "2026-02-03", false, pwd, "itadori.jpg");
    User zoe =
        makeUser("zoe@mail.com", "Vector", "catalyseur", "2026-02-04", false, pwd, "makima.jpg");
    User kevin =
        makeUser(
            "kevin@mail.com",
            "Kevator",
            "responsable",
            "2026-02-10",
            true,
            pwd,
            "pevin.jpg");
    User hakim =
        makeUser("hakim@mail.com", "Chef", "stratège", "2026-02-11", true, pwd, "garou.jpg");
    User seyman =
        makeUser("seyman@mail.com", "Seyman", "analyste", "2026-02-12", true, pwd, "eren.png");
    User uche =
        makeUser("uche@mail.com", "Uche", "support", "2026-02-13", true, pwd, "jjk.jpg");
    userRepo.saveAll(List.of(
        lea, tom, ines, tibo, lisa, noa, tim, zoe, kevin, hakim, seyman, uche
    ));

    Tournament springArena = makeTournament(
        "Spring Arena Cup 2025",
        "Compétition printanière ouverte aux nouvelles teams",
        "2025-04-15", "2025-04-25", "2025-04-10", "TERMINE", 8
    );
    Tournament elite2025 = makeTournament(
        "Elite Championship 2025",
        "Compétition élite réservée aux meilleures teams",
        "2025-05-15", "2025-05-30", "2025-05-11", "TERMINE", 8
    );
    Tournament summerPro = makeTournament(
        "Summer Pro League 2025",
        "Tournoi estival de haut niveau avec les meilleures teams",
        "2025-07-01", "2025-07-15", "2025-06-25", "TERMINE", 16
    );
    Tournament winterClash = makeTournament(
        "Vinci Winter Clash 2026",
        "Tournoi hivernal réunissant des équipes semi-professionnelles",
        "2026-01-10", "2026-01-20", "2026-01-05", "TERMINE", 12
    );
    Tournament springBattle = makeTournament(
        "Spring Battle Series 2026",
        "Série printanière avec élimination directe et forte participation",
        "2026-04-04", "2026-04-11", "2026-04-01", "EN_COURS", 8
    );
    Tournament easterCup = makeTournament(
        "Vinci Easter Cup 2026",
        "Tournoi de Pâques ouvert à toutes les teams actives",
        "2026-04-15", "2026-04-25", "2026-04-08", "OUVERT", 8
    );
    Tournament elite2026 = makeTournament(
        "Elite Championship 2026",
        "Compétition élite réservée aux meilleures teams",
        "2026-05-15", "2026-05-30", "2026-05-11", "OUVERT", 16
    );

    tournamentRepo.saveAll(List.of(
        springArena, elite2025, summerPro, winterClash,
        springBattle, easterCup, elite2026
    ));

    Team alpha = createTeam("TEAM_ALPHA", lea, null, "akatsuki.jpg");
    lea.setTeam(alpha);
    tom.setTeam(alpha);
    ines.setTeam(alpha);

    final Team omega = createTeam("TEAM_OMEGA", tibo, null, "espada.jpg");
    tibo.setTeam(omega);

    final Team iota = createTeam("TEAM_IOTA", lisa, noa, "fairytail.jpg");
    lisa.setTeam(iota);
    noa.setTeam(iota);
    tim.setTeam(iota);
    zoe.setTeam(iota);

    final Team dev = createTeam("TEAM_DEV_CAE", kevin, null, "onepiece.jpg");
    kevin.setTeam(dev);
    hakim.setTeam(dev);
    seyman.setTeam(dev);
    uche.setTeam(dev);
    userRepo.saveAll(List.of(
        lea, tom, ines, tibo, lisa, noa, tim, zoe, kevin, hakim, seyman, uche
    ));

    List<String> names = List.of(
        "TEAM_BETA", "TEAM_GAMMA", "TEAM_DELTA", "TEAM_EPSILON", "TEAM_ZETA",
        "TEAM_THETA", "TEAM_KAPPA", "TEAM_LAMBDA", "TEAM_MU", "TEAM_NU",
        "TEAM_XI", "TEAM_PI", "TEAM_SIGMA"
    );

    List<String> botTags = List.of(
        "Nova", "Raptor", "Blaze", "Echo", "Mantis", "Viper", "Astra",
        "Cipher", "Drift", "Sable", "Orion", "Nyx", "Havoc"
    );

    List<String> botAvatars = List.of(
        "butcher.jpg", "eren.png", "femmecars.jpg", "garou.jpg", "jjk.jpg",
        "lookism.jpg", "neon2.jpg", "pevin.jpg", "pion.jpg", "spiderman2099.jpg",
        "tailong.jpg", "crockmou.jpg", "flash.jpg"
    );

    List<String> teamAvatars = List.of(
        "hunter.jpg", "onepiece.jpg", "akatsuki.jpg", "espada.jpg", "fairytail.jpg"
    );

    List<String> extraSpecs = List.of(
        "tacticien", "guérisseur", "gardien", "architecte", "catalyseur"
    );

    List<Team> dummyTeams = new ArrayList<>();
    for (int i = 0; i < names.size(); i++) {
      User bot = makeUser(
          botTags.get(i).toLowerCase(Locale.ROOT) + "@demo.com",
          botTags.get(i), "exécuteur", "2025-01-01", false,
          pwd, botAvatars.get(i % botAvatars.size())
      );
      userRepo.save(bot);

      Team team = createTeam(
          names.get(i),
          bot,
          null,
          teamAvatars.get(i % teamAvatars.size())
      );
      bot.setTeam(team);
      userRepo.save(bot);
      dummyTeams.add(team);

      for (int j = 1; j <= 3; j++) {
        String tag = names.get(i).replace("TEAM_", "") + "Bot" + j;
        addBotMember(
            tag.toLowerCase(Locale.ROOT) + "@demo.com",
            tag, extraSpecs.get(j % extraSpecs.size()),
            pwd, botAvatars.get((i + j) % botAvatars.size()), team
        );
      }
    }

    springArena.setWinner(omega);
    elite2025.setWinner(iota);
    summerPro.setWinner(iota);
    winterClash.setWinner(alpha);
    tournamentRepo.saveAll(List.of(springArena, elite2025, summerPro, winterClash));

    List<Team> t = new ArrayList<>(List.of(omega, iota));
    t.addAll(dummyTeams.subList(0, 5));
    registerTeams(springArena, t, "2025-04-08");

    t = new ArrayList<>(List.of(alpha, iota));
    t.addAll(dummyTeams.subList(0, 4));
    registerTeams(elite2025, t, "2025-05-09");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dummyTeams.subList(0, 11));
    registerTeams(summerPro, t, "2025-06-20");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dummyTeams.subList(0, 9));
    registerTeams(winterClash, t, "2026-01-03");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dummyTeams.subList(0, 5));
    registerTeams(springBattle, t, "2026-03-28");

    t = new ArrayList<>(List.of(omega));
    t.addAll(dummyTeams.subList(0, 6));
    registerTeams(easterCup, t, "2026-04-05");

    t = new ArrayList<>(List.of(alpha, omega, iota));
    t.addAll(dummyTeams.subList(0, 11));
    registerTeams(elite2026, t, "2026-05-05");

    return new SeedData(
        lea, tom, ines, tibo, lisa, noa, tim, zoe,
        alpha, omega, iota, dummyTeams,
        springArena, elite2025, summerPro, winterClash,
        springBattle, easterCup, elite2026
    );
  }

  /**
   * Common seeded entities returned to subclasses for profile-specific extras.
   *
   * @param lea          lea user
   * @param tom          tom user
   * @param ines         ines user
   * @param tibo         tibo user
   * @param lisa         lisa user
   * @param noa          noa user
   * @param tim          tim user
   * @param zoe          zoe user
   * @param alpha        alpha team
   * @param omega        omega team
   * @param iota         iota team
   * @param dummyTeams   dummy teams list
   * @param springArena  spring arena tournament
   * @param elite2025    elite 2025 tournament
   * @param summerPro    summer pro tournament
   * @param winterClash  winter clash tournament
   * @param springBattle spring battle tournament
   * @param easterCup    easter cup tournament
   * @param elite2026    elite 2026 tournament
   */
  protected record SeedData(
      User lea,
      User tom,
      User ines,
      User tibo,
      User lisa,
      User noa,
      User tim,
      User zoe,
      Team alpha,
      Team omega,
      Team iota,
      List<Team> dummyTeams,
      Tournament springArena,
      Tournament elite2025,
      Tournament summerPro,
      Tournament winterClash,
      Tournament springBattle,
      Tournament easterCup,
      Tournament elite2026) {
  }
}