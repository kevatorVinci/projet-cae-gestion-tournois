package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.PlayerSelectionRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Shared base class providing reusable helpers to seed demo and non-demo data. */
public abstract class AbstractDataInitializer implements CommandLineRunner {

  @Autowired protected TeamRepository teamRepo;
  @Autowired protected TournamentRepository tournamentRepo;
  @Autowired protected InscriptionEquipeTournoiRepository inscriptionRepo;
  @Autowired protected UserRepository userRepo;
  @Autowired protected PasswordEncoder pwdEncoder;
  @Autowired protected MatchRepository matchRepo;
  @Autowired protected MatchResultRepository matchResultRepo;
  @Autowired protected PlayerSelectionRepository playerSelectionRepo;

  /** Builds a user instance without persisting it. */
  protected User makeUser(
      String email, String tag, String spec, String date, boolean admin, String pwd, String img) {
    User user = new User();
    user.setEmail(email);
    user.setTag(tag);
    user.setSpecialty(spec);
    user.setCreationDate(LocalDate.parse(date));
    user.setAdmin(admin);
    user.setPassword(pwd);
    user.setProfileImageUrl(img);
    return user;
  }

  /** Builds a tournament instance without persisting it. */
  protected Tournament makeTournament(
      String name,
      String description,
      String startDate,
      String endDate,
      String registrationDeadline,
      String status,
      int maxParticipants) {
    Tournament tournament = new Tournament();
    tournament.setName(name);
    tournament.setDescription(description);
    tournament.setStartDate(LocalDate.parse(startDate));
    tournament.setEndDate(LocalDate.parse(endDate));
    tournament.setRegistrationDeadline(LocalDate.parse(registrationDeadline));
    tournament.setStatus(status);
    tournament.setMaxParticipants(maxParticipants);
    return tournament;
  }

  /** Creates and persists a team. */
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

  /** Registers the provided teams to a tournament at the given date. */
  protected void registerTeams(Tournament tournament, List<Team> teams, String date) {
    LocalDate registrationDate = LocalDate.parse(date);
    for (Team team : teams) {
      RegistrationTeamTournament registration = new RegistrationTeamTournament();
      registration.setTournament(tournament);
      registration.setTeam(team);
      registration.setRegistrationDate(registrationDate);
      inscriptionRepo.save(registration);
    }
  }

  /** Creates and persists a match. */
  protected Match createMatch(
      Tournament tournament,
      Team team1,
      Team team2,
      int round,
      LocalDateTime dateTime,
      User admin,
      String status) {
    Match match = new Match();
    match.setTournament(tournament);
    match.setTeam1(team1);
    match.setTeam2(team2);
    match.setRound(round);
    match.setScheduledDateTime(dateTime);
    match.setAdminResponsible(admin);
    match.setStatus(status);
    return matchRepo.save(match);
  }

  /** Creates, persists and assigns a bot member to a team. */
  protected User addBotMember(
      String email, String tag, String specialty, String pwd, String img, Team team) {
    User bot = makeUser(email, tag, specialty, "2025-01-01", false, pwd, img);
    userRepo.save(bot);
    bot.setTeam(team);
    userRepo.save(bot);
    return bot;
  }

  /** Creates and persists a validated match result. */
  protected MatchResult createMatchResult(Match match, int score1, int score2, User adminEncoder) {
    MatchResult result = new MatchResult();
    result.setMatch(match);
    result.setScoreTeam1(score1);
    result.setScoreTeam2(score2);
    result.setEncodingDate(LocalDateTime.now());
    result.setAdminEncoder(adminEncoder);
    result.setValidationStatusTeam1("VALIDATED");
    result.setValidationStatusTeam2("VALIDATED");
    return matchResultRepo.save(result);
  }

  /** Adds all given members as selected players for the match and team. */
  protected void addPlayerSelections(Match match, List<User> members, Team team) {
    for (User member : members) {
      PlayerSelection selection = new PlayerSelection();
      selection.setMatch(match);
      selection.setMember(member);
      selection.setTeam(team);
      playerSelectionRepo.save(selection);
    }
  }

  /** Indicates whether the base seed can be generated. */
  protected boolean prepareBaseSeed(String pwd) {
    if (userRepo.count() > 0) {
      return false; // Evite de redoubler les données
    }
    return teamRepo.count() == 0 && tournamentRepo.count() == 0;
  }

  /** Seeds the common baseline data used by other initializers. */
  protected SeedData seedBaseData(String pwd) {
    // 1. Création stricte des utilisateurs du PDF
    User lea = makeUser("lea@mail.com", "Lynx", "tacticien", "2025-11-12", true, pwd, "luffy.png");
    User tom =
        makeUser("tom@mail.com", "Rogue", "exécuteur", "2025-12-03", false, pwd, "miles.jpg");
    User ines =
        makeUser("ines@mail.com", "Pulse", "guérisseur", "2026-01-18", false, pwd, "erza.jpg");
    User pol =
        makeUser("pol@mail.com", "Wolf", "architecte", "2026-02-02", false, pwd, "isagi.jpg");

    User tibo = makeUser("tibo@mail.com", "Iron", "gardien", "2025-10-27", true, pwd, "kaido.png");
    User neo =
        makeUser("neo@mail.com", "Shade", "catalyseur", "2025-10-30", false, pwd, "shigaraki.jpg");

    User lisa =
        makeUser("lisa@mail.com", "Storm", "exécuteur", "2026-01-10", false, pwd, "flash.jpg");
    User noa =
        makeUser("noa@mail.com", "Flash", "architecte", "2026-02-02", false, pwd, "Pessi.jpg");
    User tim = makeUser("tim@mail.com", "Titi", "gardien", "2026-02-03", false, pwd, "itadori.jpg");
    User zoe =
        makeUser("zoe@mail.com", "Vector", "catalyseur", "2026-02-04", false, pwd, "makima.jpg");

    User max = makeUser("max@mail.com", "Iron", "gardien", "2026-03-12", false, pwd, "vini.jpg");
    User ali =
        makeUser("ali@mail.com", "Putsh", "perturbateur", "2026-01-22", false, pwd, "saitama.jpg");
    User zed =
        makeUser("zed@mail.com", "Zero", "architecte", "2025-12-11", true, pwd, "yuichi.png");
    User seb = makeUser("seb@mail.com", "Ice", "guérisseur", "2026-03-01", true, pwd, "denji.jpg");
    User oli =
        makeUser("oli@mail.com", "Tiger", "tacticien", "2025-11-11", false, pwd, "speed.jpg");
    User fin = makeUser("fin@mail.com", "Final", "exécuteur", "2025-10-22", false, pwd, "gazo.jpg");

    userRepo.saveAll(
        List.of(lea, tom, ines, pol, tibo, neo, lisa, noa, tim, zoe, max, ali, zed, seb, oli, fin));

    // 2. Création des Teams
    Team alpha = createTeam("TEAM_ALPHA", lea, null, "akatsuki.jpg");
    lea.setTeam(alpha);
    tom.setTeam(alpha);
    ines.setTeam(alpha);
    pol.setTeam(alpha);

    Team omega = createTeam("TEAM_OMEGA", tibo, null, "espada.jpg");
    tibo.setTeam(omega);
    neo.setTeam(omega);

    Team iota = createTeam("TEAM_IOTA", lisa, noa, "fairytail.jpg");
    lisa.setTeam(iota);
    noa.setTeam(iota);
    tim.setTeam(iota);
    zoe.setTeam(iota);

    Team delta = createTeam("TEAM_DELTA", max, seb, "onepiece.jpg");
    max.setTeam(delta);
    ali.setTeam(delta);
    zed.setTeam(delta);
    seb.setTeam(delta);
    oli.setTeam(delta);
    fin.setTeam(delta);

    userRepo.saveAll(
        List.of(lea, tom, ines, pol, tibo, neo, lisa, noa, tim, zoe, max, ali, zed, seb, oli, fin));

    // 3. Création des Tournois (PDF Tableaux)
    Tournament springArena =
        makeTournament(
            "Spring Arena Cup 2025",
            "printanière ouverte aux nouvelles teams émergentes",
            "2025-04-15",
            "2025-04-25",
            "2025-04-10",
            "TERMINE",
            8);
    Tournament elite2025 =
        makeTournament(
            "Elite Championship 2025",
            "Compétition élite réservée aux meilleures teams",
            "2025-05-15",
            "2025-05-30",
            "2025-05-11",
            "TERMINE",
            8);
    Tournament summerPro =
        makeTournament(
            "Summer Pro League 2025",
            "Tournoi estival de haut niveau avec les meilleures teams",
            "2025-07-01",
            "2025-07-15",
            "2025-06-25",
            "TERMINE",
            16);
    Tournament winterClash =
        makeTournament(
            "Vinci Winter Clash 2026",
            "Tournoi hivernal réunissant des équipes semi-professionnelles",
            "2026-01-10",
            "2026-01-20",
            "2026-01-05",
            "TERMINE",
            12);
    Tournament easterCup =
        makeTournament(
            "Vinci Easter Cup 2026",
            "Tournoi de Pâques ouvert à toutes les teams actives",
            "2026-04-15",
            "2026-04-25",
            "2026-04-08",
            "TERMINE",
            8);

    Tournament springBattle =
        makeTournament(
            "Spring Battle Series 2026",
            "Série printanière avec élimination directe et forte participation",
            "2026-05-04",
            "2026-05-12",
            "2026-05-01",
            "EN_COURS",
            8);
    Tournament elite2026 =
        makeTournament(
            "Elite Championship 2026",
            "Compétition élite réservée aux meilleures teams",
            "2026-05-16",
            "2026-05-30",
            "2026-05-13",
            "OUVERT",
            10);

    tournamentRepo.saveAll(
        List.of(
            springArena, elite2025, summerPro, winterClash, easterCup, springBattle, elite2026));

    // 4. Création des teams additionnelles pour compléter les inscriptions de tournoi
    List<Team> dummyTeams = new ArrayList<>();
    List<String> names =
        List.of(
            "TEAM_BETA",
            "TEAM_GAMMA",
            "TEAM_EPSILON",
            "TEAM_ZETA",
            "TEAM_THETA",
            "TEAM_KAPPA",
            "TEAM_LAMBDA",
            "TEAM_MU",
            "TEAM_NU",
            "TEAM_XI",
            "TEAM_PI",
            "TEAM_SIGMA",
            "TEAM_RHO",
            "TEAM_TAU");

    List<String> botTags =
        List.of(
            "Nova", "Raptor", "Blaze", "Echo", "Mantis", "Viper", "Astra", "Cipher", "Drift",
            "Sable", "Orion", "Nyx", "Havoc", "Comet");

    List<String> botAvatars =
        List.of(
            "butcher.jpg",
            "eren.png",
            "femmecars.jpg",
            "garou.jpg",
            "jjk.jpg",
            "lookism.jpg",
            "neon2.jpg",
            "pevin.jpg",
            "pion.jpg",
            "spiderman2099.jpg",
            "tailong.jpg",
            "crockmou.jpg",
            "flash.jpg",
            "homer.jpg");

    List<String> teamAvatars =
        List.of("hunter.jpg", "onepiece.jpg", "akatsuki.jpg", "espada.jpg", "fairytail.jpg");

    List<String> extraSpecs =
        List.of("tacticien", "guérisseur", "gardien", "architecte", "catalyseur");

    for (int i = 0; i < names.size(); i++) {
      String leadTag = botTags.get(i);
      User botLead =
          makeUser(
              leadTag.toLowerCase(Locale.ROOT) + "@demo.com",
              leadTag,
              "exécuteur",
              "2025-01-01",
              false,
              pwd,
              botAvatars.get(i % botAvatars.size()));
      userRepo.save(botLead);

      Team dummy = createTeam(names.get(i), botLead, null, teamAvatars.get(i % teamAvatars.size()));
      botLead.setTeam(dummy);
      userRepo.save(botLead);
      dummyTeams.add(dummy);

      for (int j = 1; j <= 3; j++) {
        String tag = names.get(i).replace("TEAM_", "") + "Bot" + j;
        addBotMember(
            tag.toLowerCase(Locale.ROOT) + "@demo.com",
            tag,
            extraSpecs.get(j % extraSpecs.size()),
            pwd,
            botAvatars.get((i + j) % botAvatars.size()),
            dummy);
      }
    }

    return new SeedData(
        lea,
        tom,
        ines,
        pol,
        tibo,
        neo,
        lisa,
        noa,
        tim,
        zoe,
        max,
        ali,
        zed,
        seb,
        oli,
        fin,
        alpha,
        omega,
        iota,
        delta,
        dummyTeams,
        springArena,
        elite2025,
        summerPro,
        winterClash,
        easterCup,
        springBattle,
        elite2026);
  }

  /** Aggregate of seeded entities shared across demo generation steps. */
  protected record SeedData(
      User lea,
      User tom,
      User ines,
      User pol,
      User tibo,
      User neo,
      User lisa,
      User noa,
      User tim,
      User zoe,
      User max,
      User ali,
      User zed,
      User seb,
      User oli,
      User fin,
      Team alpha,
      Team omega,
      Team iota,
      Team delta,
      List<Team> dummyTeams,
      Tournament springArena,
      Tournament elite2025,
      Tournament summerPro,
      Tournament winterClash,
      Tournament easterCup,
      Tournament springBattle,
      Tournament elite2026) {}
}
