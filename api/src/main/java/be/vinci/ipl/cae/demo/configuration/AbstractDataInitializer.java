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
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Shared helper methods for all profile-specific data initializers.
 */
public abstract class AbstractDataInitializer implements CommandLineRunner {

  @Autowired
  protected TeamRepository teamRepo;

  @Autowired
  protected TournamentRepository tournamentRepo;

  @Autowired
  protected InscriptionEquipeTournoiRepository inscriptionRepo;

  @Autowired
  protected UserRepository userRepo;

  @Autowired
  protected PasswordEncoder pwdEncoder;

  @Autowired
  protected MatchRepository matchRepo;

  @Autowired
  protected MatchResultRepository matchResultRepo;

  @Autowired
  protected PlayerSelectionRepository playerSelectionRepo;

  /**
   * Builds an unsaved user entity.
   */
  protected User makeUser(
      String email,
      String tag,
      String spec,
      String date,
      boolean admin,
      String pwd,
      String img) {
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

  /**
   * Builds an unsaved tournament entity.
   */
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

  /**
   * Creates and saves one team.
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
   * Creates and attaches a bot member to a team.
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
   * Registers teams to one tournament on a given date.
   */
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

  /**
   * Prepares baseline seed behavior.
   *
   * @param pwd encoded default password.
   * @return true when base entities must be created from scratch.
   */
  protected boolean prepareBaseSeed(String pwd) {
    if (userRepo.count() > 0) {
      for (User user : userRepo.findAll()) {
        user.setPassword(pwd);
        userRepo.save(user);
      }
      return false;
    }
    return teamRepo.count() == 0 && tournamentRepo.count() == 0;
  }

  /**
   * Seeds users, teams, tournaments, registrations and simulated matches.
   */
  @SuppressWarnings("PMD.ExcessiveMethodLength")
  protected SeedData seedBaseData(String pwd) {
    User lea = makeUser("lea@mail.com", "Lynx", "tacticien", "2025-11-12", true, pwd, "luffy.png");
    User tom = makeUser("tom@mail.com", "Rogue", "exécuteur", "2025-12-03", false, pwd, "miles.jpg");
    User ines = makeUser("ines@mail.com", "Pulse", "guérisseur", "2026-01-18", false, pwd, "erza.jpg");
    User tibo = makeUser("tibo@mail.com", "Iron", "gardien", "2025-10-27", true, pwd, "kaido.png");
    User lisa = makeUser("lisa@mail.com", "Storm", "exécuteur", "2026-01-10", false, pwd, "flash.jpg");
    User noa = makeUser("noa@mail.com", "Flash", "architecte", "2026-02-02", false, pwd, "Pessi.jpg");
    User tim = makeUser("tim@mail.com", "Titi", "gardien", "2026-02-03", false, pwd, "itadori.jpg");
    User zoe = makeUser("zoe@mail.com", "Vector", "catalyseur", "2026-02-04", false, pwd, "makima.jpg");
    User kevin = makeUser("kevin@mail.com", "Kevator", "responsable", "2026-02-10", true, pwd, "pevin.jpg");
    User hakim = makeUser("hakim@mail.com", "Chef", "stratège", "2026-02-11", true, pwd, "garou.jpg");
    User seymen = makeUser("seymen@mail.com", "Seymen", "analyste", "2026-02-12", true, pwd, "eren.png");
    User uche = makeUser("uche@mail.com", "Uche", "support", "2026-02-13", true, pwd, "jjk.jpg");

    userRepo.saveAll(List.of(
        lea,
        tom,
        ines,
        tibo,
        lisa,
        noa,
        tim,
        zoe,
        kevin,
        hakim,
        seymen,
        uche
    ));

    Tournament springArena = makeTournament(
        "Spring Arena Cup 2025",
        "Compétition printanière ouverte aux nouvelles teams",
        "2025-04-15",
        "2025-04-25",
        "2025-04-10",
        "TERMINE",
        8
    );
    Tournament elite2025 = makeTournament(
        "Elite Championship 2025",
        "Compétition élite réservée aux meilleures teams",
        "2025-05-15",
        "2025-05-30",
        "2025-05-11",
        "TERMINE",
        8
    );
    Tournament summerPro = makeTournament(
        "Summer Pro League 2025",
        "Tournoi estival de haut niveau avec les meilleures teams",
        "2025-07-01",
        "2025-07-15",
        "2025-06-25",
        "TERMINE",
        16
    );
    Tournament winterClash = makeTournament(
        "Vinci Winter Clash 2026",
        "Tournoi hivernal réunissant des équipes semi-professionnelles",
        "2026-01-10",
        "2026-01-20",
        "2026-01-05",
        "TERMINE",
        12
    );
    Tournament springBattle = makeTournament(
        "Spring Battle Series 2026",
        "Série printanière en cours (demi-finales)",
        "2026-04-04",
        "2026-04-11",
        "2026-04-01",
        "EN_COURS",
        8
    );
    Tournament easterCup = makeTournament(
        "Vinci Easter Cup 2026",
        "Tournoi de Pâques ouvert à toutes les teams actives",
        "2026-04-15",
        "2026-04-25",
        "2026-04-08",
        "OUVERT",
        8
    );
    Tournament elite2026 = makeTournament(
        "Elite Championship 2026",
        "Compétition élite réservée aux meilleures teams",
        "2026-05-15",
        "2026-05-30",
        "2026-05-11",
        "OUVERT",
        16
    );

    tournamentRepo.saveAll(List.of(
        springArena,
        elite2025,
        summerPro,
        winterClash,
        springBattle,
        easterCup,
        elite2026
    ));

    Team alpha = createTeam("TEAM_ALPHA", lea, null, "akatsuki.jpg");
    lea.setTeam(alpha);
    tom.setTeam(alpha);
    ines.setTeam(alpha);

    Team omega = createTeam("TEAM_OMEGA", tibo, null, "espada.jpg");
    tibo.setTeam(omega);

    Team iota = createTeam("TEAM_IOTA", lisa, noa, "fairytail.jpg");
    lisa.setTeam(iota);
    noa.setTeam(iota);
    tim.setTeam(iota);
    zoe.setTeam(iota);

    Team dev = createTeam("TEAM_DEV_CAE", kevin, null, "onepiece.jpg");
    kevin.setTeam(dev);
    hakim.setTeam(dev);
    seymen.setTeam(dev);
    uche.setTeam(dev);

    addBotMember("alphabot1@demo.com", "AlphaBot1", "architecte", pwd, "neon2.jpg", alpha);
    addBotMember("alphabot2@demo.com", "AlphaBot2", "tacticien", pwd, "lookism.jpg", alpha);
    addBotMember("alphabot3@demo.com", "AlphaBot3", "gardien", pwd, "spiderman2099.jpg", alpha);
    addBotMember("alphabot4@demo.com", "AlphaBot4", "guérisseur", pwd, "tailong.jpg", alpha);
    addBotMember("alphabot5@demo.com", "AlphaBot5", "catalyseur", pwd, "crockmou.jpg", alpha);

    addBotMember("omegabot1@demo.com", "OmegaBot1", "gardien", pwd, "kaido.png", omega);
    addBotMember("omegabot2@demo.com", "OmegaBot2", "tacticien", pwd, "garou.jpg", omega);
    addBotMember("omegabot3@demo.com", "OmegaBot3", "architecte", pwd, "jjk.jpg", omega);

    userRepo.saveAll(List.of(
        lea,
        tom,
        ines,
        tibo,
        lisa,
        noa,
        tim,
        zoe,
        kevin,
        hakim,
        seymen,
        uche
    ));

    List<Team> dummyTeams = createDummyTeams(pwd);

    springArena.setWinner(omega);
    elite2025.setWinner(iota);
    summerPro.setWinner(iota);
    winterClash.setWinner(alpha);
    tournamentRepo.saveAll(List.of(springArena, elite2025, summerPro, winterClash));

    List<Team> registrations = new ArrayList<>(List.of(omega, iota));
    registrations.addAll(dummyTeams.subList(0, 5));
    registerTeams(springArena, registrations, "2025-04-08");
    simulatePastTournament(springArena, registrations, omega);

    registrations = new ArrayList<>(List.of(alpha, iota));
    registrations.addAll(dummyTeams.subList(0, 4));
    registerTeams(elite2025, registrations, "2025-05-09");
    simulatePastTournament(elite2025, registrations, iota);

    registrations = new ArrayList<>(List.of(alpha, omega, iota));
    registrations.addAll(dummyTeams.subList(0, 11));
    registerTeams(summerPro, registrations, "2025-06-20");
    simulatePastTournament(summerPro, registrations, iota);

    registrations = new ArrayList<>(List.of(alpha, omega, iota));
    registrations.addAll(dummyTeams.subList(0, 9));
    registerTeams(winterClash, registrations, "2026-01-03");
    simulatePastTournament(winterClash, registrations, alpha);

    registrations = new ArrayList<>(List.of(alpha, omega, iota));
    registrations.addAll(dummyTeams.subList(0, 5));
    registerTeams(springBattle, registrations, "2026-03-28");
    simulateOngoingToSemiFinals(springBattle, registrations);

    registrations = new ArrayList<>(List.of(omega));
    registrations.addAll(dummyTeams.subList(0, 6));
    registerTeams(easterCup, registrations, "2026-04-05");

    registrations = new ArrayList<>(List.of(alpha, omega, iota));
    registrations.addAll(dummyTeams.subList(0, 11));
    registerTeams(elite2026, registrations, "2026-05-05");

    return new SeedData(
        lea,
        tom,
        ines,
        tibo,
        lisa,
        noa,
        tim,
        zoe,
        alpha,
        omega,
        iota,
        dummyTeams,
        springArena,
        elite2025,
        summerPro,
        winterClash,
        springBattle,
        easterCup,
        elite2026
    );
  }

  /**
   * Creates the set of demo dummy teams and their bot members.
   */
  private List<Team> createDummyTeams(String pwd) {
    List<String> names = List.of(
        "TEAM_BETA",
        "TEAM_GAMMA",
        "TEAM_DELTA",
        "TEAM_EPSILON",
        "TEAM_ZETA",
        "TEAM_THETA",
        "TEAM_KAPPA",
        "TEAM_LAMBDA",
        "TEAM_MU",
        "TEAM_NU",
        "TEAM_XI",
        "TEAM_PI",
        "TEAM_SIGMA"
    );

    List<String> botTags = List.of(
        "Nova",
        "Raptor",
        "Blaze",
        "Echo",
        "Mantis",
        "Viper",
        "Astra",
        "Cipher",
        "Drift",
        "Sable",
        "Orion",
        "Nyx",
        "Havoc"
    );

    List<String> botAvatars = List.of(
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
        "flash.jpg"
    );

    List<String> teamAvatars = List.of(
        "hunter.jpg",
        "onepiece.jpg",
        "akatsuki.jpg",
        "espada.jpg",
        "fairytail.jpg"
    );

    List<String> extraSpecs = List.of(
        "tacticien",
        "guérisseur",
        "gardien",
        "architecte",
        "catalyseur"
    );

    List<Team> dummyTeams = new ArrayList<>();
    for (int i = 0; i < names.size(); i++) {
      User bot = makeUser(
          botTags.get(i).toLowerCase(Locale.ROOT) + "@demo.com",
          botTags.get(i),
          "exécuteur",
          "2025-01-01",
          false,
          pwd,
          botAvatars.get(i % botAvatars.size())
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
            tag,
            extraSpecs.get(j % extraSpecs.size()),
            pwd,
            botAvatars.get((i + j) % botAvatars.size()),
            team
        );
      }
    }

    return dummyTeams;
  }

  /**
   * Simulates a fully completed single-elimination tournament.
   */
  protected void simulatePastTournament(Tournament tournament, List<Team> teams, Team winner) {
    if (!hasNoMatches(tournament)) {
      return;
    }

    List<Team> currentRound = new ArrayList<>(teams);
    currentRound.remove(winner);
    Collections.shuffle(currentRound);
    currentRound.add(0, winner);

    int round = 1;
    LocalDateTime matchDate = tournament.getStartDate().atTime(10, 0);
    User admin = findAnyAdmin();

    int[] predefinedLosingScores = {1, 0, 2, 1, 0};
    int matchCounter = 0;

    while (currentRound.size() > 1) {
      List<Team> nextRound = new ArrayList<>();
      int power = 1;
      while (power < currentRound.size()) {
        power *= 2;
      }
      int byes = power - currentRound.size();

      int teamIndex = 0;
      for (int i = 0; i < byes; i++) {
        Team byeTeam = currentRound.get(teamIndex++);
        nextRound.add(byeTeam);
        createMatch(
            tournament,
            byeTeam,
            null,
            round,
            matchDate,
            admin,
            "TERMINE"
        );
      }

      while (teamIndex < currentRound.size()) {
        Team team1 = currentRound.get(teamIndex++);
        Team team2 = currentRound.get(teamIndex++);
        Match match = createMatch(
            tournament,
            team1,
            team2,
            round,
            matchDate,
            admin,
            "TERMINE"
        );

        int winningScore = 3;
        int losingScore = predefinedLosingScores[
            matchCounter % predefinedLosingScores.length
            ];
        matchCounter++;

        createMatchResult(match, winningScore, losingScore, admin);
        addCompletedMatchSelections(match);
        nextRound.add(team1);
      }

      currentRound = nextRound;
      round++;
      matchDate = matchDate.plusDays(2);
    }

    tournament.setMatchSchedulePublished(true);
    tournamentRepo.save(tournament);
  }

  /**
   * Simulates an ongoing tournament stopped at semi-finals for an 8-team bracket.
   */
  protected void simulateOngoingToSemiFinals(Tournament tournament, List<Team> teams) {
    if (!hasNoMatches(tournament)) {
      return;
    }
    if (teams.size() != 8) {
      return;
    }

    User admin = findAnyAdmin();
    LocalDateTime matchDate = tournament.getStartDate().atTime(10, 0);

    Match qf1 = createMatch(
        tournament,
        teams.get(0),
        teams.get(1),
        1,
        matchDate,
        admin,
        "TERMINE"
    );
    createMatchResult(qf1, 3, 1, admin);
    addCompletedMatchSelections(qf1);

    Match qf2 = createMatch(
        tournament,
        teams.get(2),
        teams.get(3),
        1,
        matchDate,
        admin,
        "TERMINE"
    );
    createMatchResult(qf2, 3, 2, admin);
    addCompletedMatchSelections(qf2);

    Match qf3 = createMatch(
        tournament,
        teams.get(4),
        teams.get(5),
        1,
        matchDate,
        admin,
        "TERMINE"
    );
    createMatchResult(qf3, 3, 0, admin);
    addCompletedMatchSelections(qf3);

    Match qf4 = createMatch(
        tournament,
        teams.get(6),
        teams.get(7),
        1,
        matchDate,
        admin,
        "TERMINE"
    );
    createMatchResult(qf4, 3, 1, admin);
    addCompletedMatchSelections(qf4);

    LocalDateTime semiDate = matchDate.plusDays(3);
    createMatch(
        tournament,
        teams.get(0),
        teams.get(2),
        2,
        semiDate,
        admin,
        "PENDING"
    );
    createMatch(
        tournament,
        teams.get(4),
        teams.get(6),
        2,
        semiDate,
        admin,
        "PENDING"
    );

    tournament.setMatchSchedulePublished(true);
    tournamentRepo.save(tournament);
  }

  /**
   * Creates and saves one match.
   */
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

  /**
   * Creates and saves one validated match result.
   */
  protected MatchResult createMatchResult(
      Match match,
      int score1,
      int score2,
      User adminEncoder) {
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

  /**
   * Adds explicit player selections for one team in one match.
   */
  protected void addPlayerSelections(Match match, List<User> members, Team team) {
    for (User member : members) {
      PlayerSelection selection = new PlayerSelection();
      selection.setMatch(match);
      selection.setMember(member);
      selection.setTeam(team);
      playerSelectionRepo.save(selection);
    }
  }

  /**
   * Adds 4-player compositions for both teams of a completed match.
   */
  protected void addCompletedMatchSelections(Match match) {
    if (match == null || match.getTeam1() == null || match.getTeam2() == null) {
      return;
    }
    addSelectionsForTeam(match, match.getTeam1());
    addSelectionsForTeam(match, match.getTeam2());
  }

  /**
   * Adds selections for one team using up to 4 members.
   */
  private void addSelectionsForTeam(Match match, Team team) {
    List<User> selectedMembers = getMembersOf(team, 4);
    addPlayerSelections(match, selectedMembers, team);
  }

  /**
   * Checks whether a tournament has no generated matches yet.
   */
  protected boolean hasNoMatches(Tournament tournament) {
    return matchRepo
        .findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournament.getId())
        .isEmpty();
  }

  /**
   * Finds any admin user from the current database.
   */
  protected User findAnyAdmin() {
    for (User user : userRepo.findAll()) {
      if (user.isAdmin()) {
        return user;
      }
    }
    throw new IllegalStateException("No admin user found in DB.");
  }

  /**
   * Returns up to maxCount members for the given team.
   */
  protected List<User> getMembersOf(Team team, int maxCount) {
    List<User> result = new ArrayList<>();
    for (User user : userRepo.findAll()) {
      if (team.equals(user.getTeam())) {
        result.add(user);
        if (result.size() >= maxCount) {
          break;
        }
      }
    }
    return result;
  }

  /**
   * Snapshot of seeded base entities reused by profile-specific initializers.
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
