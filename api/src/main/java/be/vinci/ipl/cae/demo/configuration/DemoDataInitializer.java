package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;


/**
 * Seeds demo-only tournaments, massive test scenarios, and registrations
 * on top of the shared base dataset.
 */
@Component
@Profile("demo")
public class DemoDataInitializer extends AbstractDataInitializer {

  private static final List<String> PROFILE_IMAGES = List.of(
      "luffy.png",
      "miles.jpg",
      "erza.jpg",
      "kaido.png",
      "flash.jpg",
      "Pessi.jpg",
      "itadori.jpg",
      "makima.jpg",
      "eren.png",
      "garou.jpg"
  );

  private static final List<String> TEAM_IMAGES = List.of(
      "akatsuki.jpg",
      "espada.jpg",
      "fairytail.jpg",
      "onepiece.jpg",
      "hunter.jpg"
  );

  @Override
  @Transactional
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    boolean shouldSeedBase = prepareBaseSeed(pwd);

    if (shouldSeedBase) {
      SeedData data = seedBaseData(pwd);
      processDemoRequirements(data);
      System.out.println("[demo] Scénario client initialisé (strictement basé sur la fiche démo).");
      return;
    }

    System.out.println("[demo] Base déjà présente: aucun tournoi additionnel n'a été créé.");
  }

  /**
   * Generates demo data covering the main checklist scenarios.
   */
  private void seedMassiveChecklistData(String pwd, SeedData baseData) {
    System.out.println("[demo] Generating massive checklist test data...");

    ChecklistUsers users = createChecklistUsers(pwd);
    ChecklistTeams teams = createChecklistTeams(users);
    ChecklistTournaments tournaments = createChecklistTournaments(baseData, teams);

    createChecklistMatches(baseData, teams, tournaments);
  }

  /**
   * Seeds the full customer demo scenario from the iteration-3 sheet.
   */
  private void processDemoRequirements(SeedData data) {
    List<Team> regSpringArena = new ArrayList<>(List.of(data.omega()));
    regSpringArena.addAll(data.dummyTeams().subList(0, 6)); // Total: 7
    registerTeams(data.springArena(), regSpringArena, "2025-04-08");

    List<Team> regElite25 = new ArrayList<>(List.of(data.iota(), data.omega()));
    regElite25.addAll(data.dummyTeams().subList(0, 4)); // Total: 6
    registerTeams(data.elite2025(), regElite25, "2025-05-10");

    List<Team> regSummerPro = new ArrayList<>(List.of(data.alpha(), data.iota()));
    regSummerPro.addAll(data.dummyTeams().subList(0, 12)); // Total: 14
    registerTeams(data.summerPro(), regSummerPro, "2025-06-24");

    List<Team> regWinterClash = new ArrayList<>(List.of(data.delta(), data.omega()));
    regWinterClash.addAll(data.dummyTeams().subList(0, 10)); // Total: 12
    registerTeams(data.winterClash(), regWinterClash, "2026-01-04");

    List<Team> regEasterCup = new ArrayList<>(List.of(data.delta()));
    regEasterCup.addAll(data.dummyTeams().subList(0, 6)); // Total: 7
    registerTeams(data.easterCup(), regEasterCup, "2026-04-07");

    List<Team> regSpringBattle = new ArrayList<>(
        List.of(data.alpha(), data.delta(), data.iota(), data.omega()));
    regSpringBattle.addAll(data.dummyTeams().subList(0, 4)); // Total: 8
    registerTeams(data.springBattle(), regSpringBattle, "2026-04-30");

    List<Team> regElite26 = new ArrayList<>(List.of(data.alpha(), data.iota()));
    regElite26.addAll(data.dummyTeams().subList(0, 7)); // Total: 9 (sans DELTA)
    registerTeams(data.elite2026(), regElite26, "2026-05-10");

    simulatePastTournament(data.springArena(), regSpringArena, data.omega(), data.lea());
    simulatePastTournament(data.elite2025(), regElite25, data.iota(), data.lea());
    simulatePastTournament(data.summerPro(), regSummerPro, data.alpha(), data.lea());
    simulatePastTournament(data.winterClash(), regWinterClash, data.delta(), data.lea());
    simulatePastTournament(data.easterCup(), regEasterCup, data.delta(), data.lea());

    LocalDateTime demoDateTime = LocalDateTime.of(2026, 5, 7, 11, 5);

    Match matchDeltaIota = createMatch(
      data.springBattle(),
      data.delta(),
      data.iota(),
      1,
      demoDateTime.minusMinutes(5),
      data.lea(),
      "PENDING"
    );
    addPlayerSelections(
        matchDeltaIota,
        List.of(data.max(), data.seb(), data.ali(), data.zed()),
        data.delta()
    );
    addPlayerSelections(
        matchDeltaIota,
        List.of(data.lisa(), data.noa(), data.tim(), data.zoe()),
        data.iota()
    );

    createMatch(
        data.springBattle(),
        data.omega(),
        data.alpha(),
        1,
        demoDateTime.plusHours(3),
        data.lea(),
        "PENDING"
    );

    Match matchBetaGamma = createMatch(
      data.springBattle(),
      data.dummyTeams().get(0),
      data.dummyTeams().get(1),
      1,
      demoDateTime.plusHours(4),
      data.lea(),
      "PENDING"
    );
    addSelectionsForMatch(matchBetaGamma);

    Match matchEpsilonZeta = createMatch(
      data.springBattle(),
      data.dummyTeams().get(2),
      data.dummyTeams().get(3),
      1,
      demoDateTime.plusHours(5),
      data.lea(),
      "PENDING"
    );
    addSelectionsForMatch(matchEpsilonZeta);

    createMatch(
      data.springBattle(),
      null,
      null,
      2,
      demoDateTime.plusHours(7),
      data.lea(),
      "PENDING"
    );

    data.springBattle().setMatchSchedulePublished(true);
    tournamentRepo.save(data.springBattle());
  }

  /**
   * Generates a complete elimination bracket while forcing the configured champion.
   */
  private void simulatePastTournament(Tournament tournament, List<Team> teams, Team winner, User admin) {
    if (teams == null || teams.size() < 2 || winner == null) {
      return;
    }

    tournament.setWinner(winner);
    tournament.setMatchSchedulePublished(true);
    tournamentRepo.save(tournament);

    List<Team> orderedTeams = new ArrayList<>(teams);
    orderedTeams.remove(winner);
    orderedTeams.add(0, winner);

    int teamCount = orderedTeams.size();
    int bracketSize = nextPowerOfTwo(teamCount);
    int byesInRound1 = bracketSize - teamCount;

    int round = 1;
    List<Team> currentRound;

    // Byes are allowed only in round 1. Starting from round 2,
    // every match is a real head-to-head with 2 teams.
    if (byesInRound1 > 0) {
      List<Team> nextRound = new ArrayList<>();
      LocalDateTime round1Start = buildRoundStartDate(tournament.getStartDate(), 1);
      int matchIndexInRound = 0;

      for (int i = 0; i < byesInRound1; i++) {
        Team autoQualified = orderedTeams.get(i);
        createMatch(
            tournament,
            autoQualified,
            null,
            1,
            round1Start.plusHours(matchIndexInRound * 2L),
            admin,
            "TERMINE"
        );
        nextRound.add(autoQualified);
        matchIndexInRound++;
      }

      List<Team> playingRound1 = orderedTeams.subList(byesInRound1, teamCount);
      for (int i = 0; i < playingRound1.size(); i += 2) {
        Team t1 = playingRound1.get(i);
        Team t2 = playingRound1.get(i + 1);

        LocalDateTime matchDate = round1Start.plusHours(matchIndexInRound * 2L);
        Match match = createMatch(tournament, t1, t2, 1, matchDate, admin, "TERMINE");

        Team matchWinner = pickMatchWinner(t1, t2, winner, 1, matchIndexInRound);
        int winnerScore = 3 + Math.floorMod(1 + matchIndexInRound, 3); // 3..5
        int loserScore = Math.max(0, winnerScore - (2 + Math.floorMod(1 + matchIndexInRound, 2)));

        if (matchWinner.equals(t1)) {
          createMatchResult(match, winnerScore, loserScore, admin);
          nextRound.add(t1);
        } else {
          createMatchResult(match, loserScore, winnerScore, admin);
          nextRound.add(t2);
        }

        addSelectionsForMatch(match);
        matchIndexInRound++;
      }

      currentRound = nextRound;
      round = 2;
    } else {
      currentRound = new ArrayList<>(orderedTeams);
    }

    while (currentRound.size() > 1) {
      if (round > 1 && currentRound.size() % 2 != 0) {
        throw new IllegalStateException(
            "Bracket invalide: un tour automatique est requis après le round 1.");
      }

      List<Team> nextRound = new ArrayList<>();
      LocalDateTime roundStart = buildRoundStartDate(tournament.getStartDate(), round);
      int matchIndexInRound = 0;

      for (int i = 0; i < currentRound.size(); i += 2) {
        Team t1 = currentRound.get(i);
        Team t2 = currentRound.get(i + 1);

        LocalDateTime matchDate = roundStart.plusHours(matchIndexInRound * 2L);
        Match match = createMatch(tournament, t1, t2, round, matchDate, admin, "TERMINE");

        Team matchWinner = pickMatchWinner(t1, t2, winner, round, matchIndexInRound);
        int winnerScore = 3 + Math.floorMod(round + matchIndexInRound, 3); // 3..5
        int loserScore = Math.max(0, winnerScore - (2 + Math.floorMod(round + matchIndexInRound, 2)));

        if (matchWinner.equals(t1)) {
          createMatchResult(match, winnerScore, loserScore, admin);
          nextRound.add(t1);
        } else {
          createMatchResult(match, loserScore, winnerScore, admin);
          nextRound.add(t2);
        }

        addSelectionsForMatch(match);
        matchIndexInRound++;
      }

      currentRound = nextRound;
      round++;
    }

    ensureAllRegisteredTeamsPlayed(tournament, teams);
  }

  private void ensureAllRegisteredTeamsPlayed(Tournament tournament, List<Team> registeredTeams) {
    Set<Long> playedTeamIds = new HashSet<>();

    for (Match match : matchRepo.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournament.getId())) {
      if (match.getTeam1() != null) {
        playedTeamIds.add(match.getTeam1().getId());
      }
      if (match.getTeam2() != null) {
        playedTeamIds.add(match.getTeam2().getId());
      }
    }

    for (Team team : registeredTeams) {
      if (!playedTeamIds.contains(team.getId())) {
        throw new IllegalStateException(
            "Bracket invalide: l'équipe " + team.getName() + " ne joue aucun match.");
      }
    }
  }

  private int nextPowerOfTwo(int n) {
    int value = 1;
    while (value < n) {
      value <<= 1;
    }
    return value;
  }

  private LocalDateTime buildRoundStartDate(LocalDate tournamentStart, int round) {
    return tournamentStart.atTime(14, 0).plusDays((long) (round - 1) * 2);
  }

  private Team pickMatchWinner(
      Team team1,
      Team team2,
      Team tournamentWinner,
      int round,
      int matchIndexInRound) {
    if (team1.equals(tournamentWinner)) {
      return team1;
    }
    if (team2.equals(tournamentWinner)) {
      return team2;
    }
    // Deterministic alternation for non-final matches.
    return Math.floorMod(round + matchIndexInRound, 2) == 0 ? team1 : team2;
  }

  private void addSelectionsForMatch(Match match) {
    List<User> team1Members = new ArrayList<>();
    List<User> team2Members = new ArrayList<>();

    for (User user : userRepo.findAll()) {
      if (match.getTeam1().equals(user.getTeam())) {
        team1Members.add(user);
      } else if (match.getTeam2().equals(user.getTeam())) {
        team2Members.add(user);
      }
    }

    addPlayerSelections(match, team1Members, match.getTeam1());
    addPlayerSelections(match, team2Members, match.getTeam2());
  }

  private User buildMin4Lead(String pwd) {
    return createDemoUser("min4.lead@demo.com", "Min4Lead", "tacticien", pwd);
  }

  private User buildMin4P2(String pwd) {
    return createDemoUser("min4.p2@demo.com", "Min4P2", "exécuteur", pwd);
  }

  private User buildMin4P3(String pwd) {
    return createDemoUser("min4.p3@demo.com", "Min4P3", "gardien", pwd);
  }

  private User buildMin4P4(String pwd) {
    return createDemoUser("min4.p4@demo.com", "Min4P4", "guérisseur", pwd);
  }

  private User buildMin3Lead(String pwd) {
    return createDemoUser("min3.lead@demo.com", "Min3Lead", "tacticien", pwd);
  }

  private User buildMin3P2(String pwd) {
    return createDemoUser("min3.p2@demo.com", "Min3P2", "exécuteur", pwd);
  }

  private User buildMin3P3(String pwd) {
    return createDemoUser("min3.p3@demo.com", "Min3P3", "gardien", pwd);
  }

  private User buildDualLead1(String pwd) {
    return createDemoUser("dual.lead1@demo.com", "DualLead1", "architecte", pwd);
  }

  private User buildDualLead2(String pwd) {
    return createDemoUser("dual.lead2@demo.com", "DualLead2", "tacticien", pwd);
  }

  private User buildDualP3(String pwd) {
    return createDemoUser("dual.p3@demo.com", "DualP3", "exécuteur", pwd);
  }

  private User buildDualP4(String pwd) {
    return createDemoUser("dual.p4@demo.com", "DualP4", "gardien", pwd);
  }

  private User buildSigmaLead(String pwd) {
    return createDemoUser("sigma.lead@demo.com", "SigmaLead", "tacticien", pwd);
  }

  private User buildSigmaUnavailable(String pwd) {
    return createDemoUser("sigma.unavailable@demo.com", "SigmaOff", "exécuteur", pwd);
  }

  private User buildSigmaP3(String pwd) {
    return createDemoUser("sigma.p3@demo.com", "SigmaP3", "gardien", pwd);
  }

  private User buildTagDup(String pwd) {
    createDemoUser("demand.pending@demo.com", "PendingPlayer", "exécuteur", pwd);
    createDemoUser("demand.accepted@demo.com", "AcceptedPlayer", "gardien", pwd);
    createDemoUser("demand.rejected@demo.com", "RejectedPlayer", "tacticien", pwd);
    return createDemoUser("tagdup@demo.com", "Rogue", "architecte", pwd);
  }

  private ChecklistUsers createChecklistUsers(String pwd) {
    return new ChecklistUsers(
        buildMin4Lead(pwd),
        buildMin4P2(pwd),
        buildMin4P3(pwd),
        buildMin4P4(pwd),
        buildMin3Lead(pwd),
        buildMin3P2(pwd),
        buildMin3P3(pwd),
        buildDualLead1(pwd),
        buildDualLead2(pwd),
        buildDualP3(pwd),
        buildDualP4(pwd),
        buildSigmaLead(pwd),
        buildSigmaUnavailable(pwd),
        buildSigmaP3(pwd),
        buildTagDup(pwd)
    );
  }

  private ChecklistTeams createChecklistTeams(ChecklistUsers users) {
    Team teamMin4Ok = createChecklistTeam(
        "TEAMMIN4OK",
        users.min4Lead(),
        null,
        users.min4Lead(),
        users.min4P2(),
        users.min4P3(),
        users.min4P4()
    );

    Team teamMin3Ko = createChecklistTeam(
        "TEAMMIN3KO",
        users.min3Lead(),
        null,
        users.min3Lead(),
        users.min3P2(),
        users.min3P3()
    );

    Team teamDualLead = createChecklistTeam(
        "TEAMDUALLEAD",
        users.dualLead1(),
        users.dualLead2(),
        users.dualLead1(),
        users.dualLead2(),
        users.dualP3(),
        users.dualP4()
    );

    Team teamSigmaShort = createChecklistTeam(
        "TEAMSIGMASHORT",
        users.sigmaLead(),
        null,
        users.sigmaLead(),
        users.sigmaUnavailable(),
        users.sigmaP3()
    );

    Team teamTagDupOk = createChecklistTeam(
        "TEAMTAGDUPOK",
        users.tagDup(),
        null,
        users.tagDup()
    );

    return new ChecklistTeams(
        teamMin4Ok,
        teamMin3Ko,
        teamDualLead,
        teamSigmaShort,
        teamTagDupOk
    );
  }

  private ChecklistTournaments createChecklistTournaments(
      SeedData baseData,
      ChecklistTeams teams) {
    Tournament devOpenSlots = getOrCreateTournament(
        "DEVOPENSLOTS",
        "Tournoi avec places dispo",
        "2026-09-01",
        "2026-09-15",
        "2026-08-20",
        "OUVERT",
        16
    );
    registerTeams(
        devOpenSlots,
        List.of(baseData.alpha(), baseData.omega(), teams.teamDualLead()),
        "2026-05-01"
    );

    Tournament devOneSlotLeft = getOrCreateTournament(
        "DEVALERTE_1_PLACE",
        "Vite, il ne reste qu'une seule place !",
        "2026-12-01",
        "2026-12-15",
        "2026-11-20",
        "OUVERT",
        4
    );
    registerTeams(
        devOneSlotLeft,
        List.of(baseData.alpha(), baseData.omega(), baseData.iota()),
        "2026-05-01"
    );

    Tournament devFull = getOrCreateTournament(
        "DEVFULLTOURNAMENT",
        "Tournoi complet (4 max)",
        "2026-10-01",
        "2026-10-15",
        "2026-09-20",
        "OUVERT",
        4
    );
    registerTeams(devFull, baseData.dummyTeams().subList(0, 4), "2026-05-01");

    Tournament devOdd = getOrCreateTournament(
        "DEVODDPLANNING",
        "5 équipes, test de génération de bracket impair",
        "2026-11-01",
        "2026-11-15",
        "2026-10-20",
        "CLOTURE",
        8
    );
    registerTeams(
        devOdd,
        List.of(
            baseData.alpha(),
            baseData.iota(),
            teams.teamDualLead(),
            teams.teamMin4Ok(),
            teams.teamSigmaShort()
        ),
        "2026-05-01"
    );

    Tournament forfeitTourney = getOrCreateTournament(
        "Forfeit & Match Tests",
        "Tournoi pour tester les états des matchs",
        "2026-04-01",
        "2026-04-30",
        "2026-03-20",
        "EN_COURS",
        8
    );
    registerTeams(
        forfeitTourney,
        List.of(
            baseData.alpha(),
            baseData.omega(),
            baseData.iota(),
            teams.teamMin4Ok(),
            teams.teamDualLead(),
            teams.teamSigmaShort()
        ),
        "2026-03-15"
    );

    return new ChecklistTournaments(
        devOpenSlots,
        devOneSlotLeft,
        devFull,
        devOdd,
        forfeitTourney
    );
  }

  private void createChecklistMatches(
      SeedData baseData,
      ChecklistTeams teams,
      ChecklistTournaments tournaments) {
    User admin = baseData.lea();
    LocalDateTime april12 = LocalDateTime.of(2026, 4, 12, 18, 0);
    LocalDateTime april14 = LocalDateTime.of(2026, 4, 14, 18, 0);
    LocalDateTime april16 = LocalDateTime.of(2026, 4, 16, 18, 0);

    Match waitingValidationMatch = createMatch(
        tournaments.forfeitTourney(),
        baseData.alpha(),
        baseData.iota(),
        1,
        april12,
        admin,
        "TERMINE"
    );
    createCustomMatchResult(
        waitingValidationMatch,
        3,
        2,
        admin,
        "VALIDATED",
        "WAITING"
    );

    Match disputedMatch = createMatch(
        tournaments.forfeitTourney(),
        baseData.omega(),
        teams.teamSigmaShort(),
        1,
        april14,
        admin,
        "TERMINE"
    );
    createCustomMatchResult(
        disputedMatch,
        1,
        3,
        admin,
        "DISPUTED",
        "VALIDATED"
    );

    Match finishedMatch = createMatch(
        tournaments.forfeitTourney(),
        baseData.alpha(),
        teams.teamSigmaShort(),
        2,
        april16,
        admin,
        "TERMINE"
    );
    createCustomMatchResult(
        finishedMatch,
        3,
        0,
        admin,
        "VALIDATED",
        "VALIDATED"
    );

    final LocalDateTime futureMatch = LocalDateTime.of(2026, 4, 25, 18, 0);
    createMatch(
        tournaments.forfeitTourney(),
        teams.teamDualLead(),
        teams.teamMin4Ok(),
        1,
        futureMatch,
        admin,
        "PENDING"
    );
  }

  private User createDemoUser(String email, String tag, String specialty, String pwd) {
    return saveUser(
        makeUser(
            email,
            tag,
            specialty,
            "2026-01-01",
            false,
            pwd,
            pickProfileImage(email)
        )
    );
  }

  private Team createChecklistTeam(
      String name,
      User primaryResponsible,
      User secondaryResponsible,
      User... members) {
    Team team = createTeam(name, primaryResponsible, secondaryResponsible, pickTeamImage(name));
    setTeamForUsers(team, members);
    return team;
  }

  private String pickProfileImage(String key) {
    int index = Math.floorMod(key.hashCode(), PROFILE_IMAGES.size());
    return PROFILE_IMAGES.get(index);
  }

  private String pickTeamImage(String key) {
    int index = Math.floorMod(key.hashCode(), TEAM_IMAGES.size());
    return TEAM_IMAGES.get(index);
  }

  private User saveUser(User user) {
    return userRepo.save(user);
  }

  private void setTeamForUsers(Team team, User... users) {
    for (User user : users) {
      user.setTeam(team);
      userRepo.save(user);
    }
  }

  /**
   * Creates a match result with custom validation statuses.
   */
  private MatchResult createCustomMatchResult(
      Match match,
      int score1,
      int score2,
      User admin,
      String status1,
      String status2) {
    MatchResult result = createMatchResult(match, score1, score2, admin);
    result.setValidationStatusTeam1(status1);
    result.setValidationStatusTeam2(status2);
    return matchResultRepo.save(result);
  }

  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);

    Tournament t5 = getOrCreateTournament(
        "Demo Future Arena (5 Teams)",
        "Tournoi asymétrique",
        "2026-06-01",
        "2026-06-15",
        "2026-05-25",
        "CLOTURE",
        8
    );
    ensureRegistrations(t5, registrationTeams.subList(0, 5), "2026-05-20");

    Tournament t6 = getOrCreateTournament(
        "Demo Future Arena (6 Teams)",
        "Tournoi asymétrique",
        "2026-06-10",
        "2026-06-25",
        "2026-06-05",
        "CLOTURE",
        8
    );
    ensureRegistrations(t6, registrationTeams.subList(0, 6), "2026-06-01");

    Tournament t7 = getOrCreateTournament(
        "Demo Future Arena (7 Teams)",
        "Tournoi asymétrique",
        "2026-07-01",
        "2026-07-15",
        "2026-06-25",
        "CLOTURE",
        8
    );
    ensureRegistrations(t7, registrationTeams.subList(0, 7), "2026-06-20");
  }

  private Tournament getOrCreateTournament(
      String name,
      String description,
      String startDate,
      String endDate,
      String registrationDeadline,
      String status,
      int maxParticipants) {
    return tournamentRepo.findByName(name).orElseGet(() -> {
      Tournament tournament = makeTournament(
          name,
          description,
          startDate,
          endDate,
          registrationDeadline,
          status,
          maxParticipants
      );
      return tournamentRepo.save(tournament);
    });
  }

  private void ensureRegistrations(
      Tournament tournament,
      List<Team> targetTeams,
      String date) {
    List<Team> missingTeams = new ArrayList<>();
    for (Team team : targetTeams) {
      if (inscriptionRepo.findByTournamentAndTeam(tournament, team).isEmpty()) {
        missingTeams.add(team);
      }
    }
    if (!missingTeams.isEmpty()) {
      registerTeams(tournament, missingTeams, date);
    }
  }

  private List<Team> resolveRegistrationTeams(SeedData data) {
    List<Team> teams = new ArrayList<>();
    Set<Long> seen = new HashSet<>();

    if (data != null) {
      addIfAbsent(teams, seen, data.alpha());
      addIfAbsent(teams, seen, data.omega());
      addIfAbsent(teams, seen, data.iota());
      for (Team team : data.dummyTeams()) {
        addIfAbsent(teams, seen, team);
        if (teams.size() >= 8) {
          return teams;
        }
      }
    }

    List<String> preferredTeamNames = List.of(
        "TEAM_ALPHA",
        "TEAM_OMEGA",
        "TEAM_IOTA",
        "TEAM_BETA",
        "TEAM_GAMMA",
        "TEAM_DELTA",
        "TEAM_EPSILON",
        "TEAM_ZETA"
    );

    for (String name : preferredTeamNames) {
      teamRepo.findByName(name).ifPresent(team -> addIfAbsent(teams, seen, team));
      if (teams.size() >= 8) {
        return teams;
      }
    }

    for (Team team : teamRepo.findAll()) {
      addIfAbsent(teams, seen, team);
      if (teams.size() >= 8) {
        return teams;
      }
    }

    throw new IllegalStateException("Pas assez d'équipes pour générer la démo.");
  }

  private void addIfAbsent(List<Team> target, Set<Long> seen, Team team) {
    if (team != null && team.getId() != null && seen.add(team.getId())) {
      target.add(team);
    }
  }

  // CPD-OFF
  private record ChecklistUsers(
      User min4Lead,
      User min4P2,
      User min4P3,
      User min4P4,
      User min3Lead,
      User min3P2,
      User min3P3,
      User dualLead1,
      User dualLead2,
      User dualP3,
      User dualP4,
      User sigmaLead,
      User sigmaUnavailable,
      User sigmaP3,
      User tagDup) {
  }

  private record ChecklistTeams(
      Team teamMin4Ok,
      Team teamMin3Ko,
      Team teamDualLead,
      Team teamSigmaShort,
      Team teamTagDupOk) {
  }

  private record ChecklistTournaments(
      Tournament devOpenSlots,
      Tournament devOneSlotLeft,
      Tournament devFull,
      Tournament devOdd,
      Tournament forfeitTourney) {
  }
  // CPD-ON
}