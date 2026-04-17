package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
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
 * Shared helper methods for all profile-specific data initializers. Subclasses implement {@link
 * #run} and call these helpers to populate the DB.
 */
public abstract class AbstractDataInitializer implements CommandLineRunner {

  @Autowired protected TeamRepository teamRepo;

  @Autowired protected TournamentRepository tournamentRepo;

  @Autowired protected InscriptionEquipeTournoiRepository inscriptionRepo;

  @Autowired protected UserRepository userRepo;

  @Autowired protected MatchRepository matchRepo;

  @Autowired protected PasswordEncoder pwdEncoder;

  /** Creates and returns an unsaved User entity. */
  protected User makeUser(
      String email, String tag, String spec, String date, boolean admin, String pwd, String img) {
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

  /** Creates and returns an unsaved Tournament entity. */
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

  /** Creates, saves, and returns a Team entity. */
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

  /** Creates, saves, and attaches a bot user to a team. */
  protected User addBotMember(
      String email, String tag, String spec, String pwd, String img, Team team) {
    User bot = makeUser(email, tag, spec, "2025-01-01", false, pwd, img);
    userRepo.save(bot);
    bot.setTeam(team);
    userRepo.save(bot);
    return bot;
  }

  /** Creates a finished match with scores and winner. */
  protected Match makeFinishedMatch(
      Tournament tournament,
      Team team1,
      Team team2,
      int round,
      LocalDateTime date,
      int score1,
      int score2,
      Team winner) {
    Match m = new Match();
    m.setTournament(tournament);
    m.setTeam1(team1);
    m.setTeam2(team2);
    m.setRoundNumber(round);
    m.setMatchDate(date);
    m.setScoreTeam1(score1);
    m.setScoreTeam2(score2);
    m.setWinner(winner);
    m.setStatus("FINISHED");
    return m;
  }

  /** Creates a BYE match (automatic pass, no opponent). */
  protected Match makeByeMatch(Tournament tournament, Team team, int round) {
    Match m = new Match();
    m.setTournament(tournament);
    m.setTeam1(team);
    m.setTeam2(null);
    m.setRoundNumber(round);
    m.setScoreTeam1(1);
    m.setScoreTeam2(0);
    m.setWinner(team);
    m.setStatus("FINISHED");
    m.setPoolCode("BYE");
    return m;
  }

  /** Registers each team in the list to the given tournament. */
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

  /** Updates passwords when users already exist, otherwise checks for empty seed state. */
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

  /** Shared seed used by dev and demo profiles. */
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
    userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

    Tournament springArena =
        makeTournament(
            "Spring Arena Cup 2025",
            "Compétition printanière ouverte aux nouvelles teams",
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
    Tournament springBattle =
        makeTournament(
            "Spring Battle Series 2026",
            "Série printanière avec élimination directe et forte participation",
            "2026-04-04",
            "2026-04-11",
            "2026-04-01",
            "EN_COURS",
            8);
    Tournament easterCup =
        makeTournament(
            "Vinci Easter Cup 2026",
            "Tournoi de Pâques ouvert à toutes les teams actives",
            "2026-04-15",
            "2026-04-25",
            "2026-04-08",
            "OUVERT",
            8);
    Tournament elite2026 =
        makeTournament(
            "Elite Championship 2026",
            "Compétition élite réservée aux meilleures teams",
            "2026-05-15",
            "2026-05-30",
            "2026-05-11",
            "OUVERT",
            16);
    tournamentRepo.saveAll(
        List.of(
            springArena, elite2025, summerPro, winterClash, springBattle, easterCup, elite2026));

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
    userRepo.saveAll(List.of(lea, tom, ines, tibo, lisa, noa, tim, zoe));

    List<String> names =
        List.of(
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
            "TEAM_SIGMA");
    List<String> botTags =
        List.of(
            "Nova", "Raptor", "Blaze", "Echo", "Mantis", "Viper", "Astra", "Cipher", "Drift",
            "Sable", "Orion", "Nyx", "Havoc");
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
            "flash.jpg");
    List<String> teamAvatars =
        List.of("hunter.jpg", "onepiece.jpg", "akatsuki.jpg", "espada.jpg", "fairytail.jpg");
    List<String> extraSpecs =
        List.of("tacticien", "guérisseur", "gardien", "architecte", "catalyseur");

    List<Team> dummyTeams = new ArrayList<>();
    for (int i = 0; i < names.size(); i++) {
      User bot =
          makeUser(
              botTags.get(i).toLowerCase(Locale.ROOT) + "@demo.com",
              botTags.get(i),
              "exécuteur",
              "2025-01-01",
              false,
              pwd,
              botAvatars.get(i % botAvatars.size()));
      userRepo.save(bot);
      Team team = createTeam(names.get(i), bot, null, teamAvatars.get(i % teamAvatars.size()));
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
            team);
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
        elite2026);
  }

  /**
   * Ensures match history exists for all seeded tournaments. Safe to call on every boot — skips any
   * tournament that already has matches.
   */
  @SuppressWarnings("PMD.ExcessiveMethodLength")
  protected void ensureMatchHistory() {
    // Spring Battle (EN_COURS)
    tournamentRepo
        .findByName("Spring Battle Series 2026")
        .ifPresent(
            battle -> {
              if (!matchRepo.findByTournamentId(battle.getId()).isEmpty()) {
                return;
              }
              List<RegistrationTeamTournament> regs = inscriptionRepo.findByTournament(battle);
              List<Team> teams =
                  new ArrayList<>(regs.stream().map(RegistrationTeamTournament::getTeam).toList());
              Collections.shuffle(teams);
              List<Match> ms = new ArrayList<>();
              LocalDateTime base = battle.getStartDate().atTime(10, 0);
              for (int i = 0; i + 1 < teams.size(); i += 2) {
                Match m = new Match();
                m.setTournament(battle);
                m.setTeam1(teams.get(i));
                m.setTeam2(teams.get(i + 1));
                m.setRoundNumber(1);
                m.setMatchDate(base.plusHours(i / 2 * 2L));
                if (i < 4) {
                  m.setStatus("FINISHED");
                  m.setScoreTeam1(i + 2);
                  m.setScoreTeam2(i + 1);
                  m.setWinner(teams.get(i));
                } else {
                  m.setStatus("PENDING");
                }
                ms.add(m);
              }
              matchRepo.saveAll(ms);
              battle.setMatchSchedulePublished(true);
              tournamentRepo.save(battle);
            });

    // Spring Arena Cup 2025 - 7 teams, winner = TEAM_OMEGA
    // Bracket: omega(BYE) + 3 real matches R1 -> 2 real matches R2 -> finale
    tournamentRepo
        .findByName("Spring Arena Cup 2025")
        .ifPresent(
            t -> {
              if (!matchRepo.findByTournamentId(t.getId()).isEmpty()) {
                return;
              }
              Team omega = teamRepo.findByName("TEAM_OMEGA").orElseThrow();
              Team iota = teamRepo.findByName("TEAM_IOTA").orElseThrow();
              Team d0 = teamRepo.findByName("TEAM_BETA").orElseThrow();
              Team d1 = teamRepo.findByName("TEAM_GAMMA").orElseThrow();
              Team d2 = teamRepo.findByName("TEAM_DELTA").orElseThrow();
              Team d3 = teamRepo.findByName("TEAM_EPSILON").orElseThrow();
              Team d4 = teamRepo.findByName("TEAM_ZETA").orElseThrow();
              LocalDateTime b = t.getStartDate().atTime(10, 0);
              LocalDateTime b2 = b.plusDays(3);
              List<Match> ms = new ArrayList<>();
              // R1 - 3 real matches + 1 BYE
              ms.add(makeFinishedMatch(t, iota, d0, 1, b, 2, 1, iota));
              ms.add(makeFinishedMatch(t, d1, d2, 1, b.plusHours(2), 3, 1, d1));
              ms.add(makeFinishedMatch(t, d3, d4, 1, b.plusHours(4), 2, 0, d3));
              ms.add(makeByeMatch(t, omega, 1));
              // R2 - iota vs d1, omega vs d3
              ms.add(makeFinishedMatch(t, iota, d1, 2, b2, 2, 1, iota));
              ms.add(makeFinishedMatch(t, omega, d3, 2, b2.plusHours(2), 3, 2, omega));
              // Finale - omega wins
              ms.add(
                  makeFinishedMatch(t, omega, iota, 3, t.getEndDate().atTime(10, 0), 3, 1, omega));
              matchRepo.saveAll(ms);
              t.setMatchSchedulePublished(true);
              tournamentRepo.save(t);
            });

    // Elite Championship 2025 - 6 teams, winner = TEAM_IOTA
    // Bracket: 3 real matches R1 -> iota+alpha advance, d2 gets BYE in R2 -> finale
    tournamentRepo
        .findByName("Elite Championship 2025")
        .ifPresent(
            t -> {
              if (!matchRepo.findByTournamentId(t.getId()).isEmpty()) {
                return;
              }
              Team alpha = teamRepo.findByName("TEAM_ALPHA").orElseThrow();
              Team iota = teamRepo.findByName("TEAM_IOTA").orElseThrow();
              Team d0 = teamRepo.findByName("TEAM_BETA").orElseThrow();
              Team d1 = teamRepo.findByName("TEAM_GAMMA").orElseThrow();
              Team d2 = teamRepo.findByName("TEAM_DELTA").orElseThrow();
              Team d3 = teamRepo.findByName("TEAM_EPSILON").orElseThrow();
              LocalDateTime b = t.getStartDate().atTime(10, 0);
              LocalDateTime b2 = b.plusDays(3);
              List<Match> ms = new ArrayList<>();
              // R1
              ms.add(makeFinishedMatch(t, iota, d0, 1, b, 3, 1, iota));
              ms.add(makeFinishedMatch(t, alpha, d1, 1, b.plusHours(2), 2, 1, alpha));
              ms.add(makeFinishedMatch(t, d2, d3, 1, b.plusHours(4), 3, 0, d2));
              // R2
              ms.add(makeFinishedMatch(t, iota, alpha, 2, b2, 2, 1, iota));
              ms.add(makeByeMatch(t, d2, 2));
              // Finale - iota wins
              ms.add(makeFinishedMatch(t, iota, d2, 3, t.getEndDate().atTime(10, 0), 3, 1, iota));
              matchRepo.saveAll(ms);
              t.setMatchSchedulePublished(true);
              tournamentRepo.save(t);
            });

    // Summer Pro League 2025 - 14 teams, winner = TEAM_IOTA
    tournamentRepo
        .findByName("Summer Pro League 2025")
        .ifPresent(
            t -> {
              if (!matchRepo.findByTournamentId(t.getId()).isEmpty()) {
                return;
              }
              Team alpha = teamRepo.findByName("TEAM_ALPHA").orElseThrow();
              Team omega = teamRepo.findByName("TEAM_OMEGA").orElseThrow();
              Team iota = teamRepo.findByName("TEAM_IOTA").orElseThrow();
              Team d0 = teamRepo.findByName("TEAM_BETA").orElseThrow();
              Team d1 = teamRepo.findByName("TEAM_GAMMA").orElseThrow();
              Team d2 = teamRepo.findByName("TEAM_DELTA").orElseThrow();
              Team d3 = teamRepo.findByName("TEAM_EPSILON").orElseThrow();
              Team d4 = teamRepo.findByName("TEAM_ZETA").orElseThrow();
              Team d5 = teamRepo.findByName("TEAM_THETA").orElseThrow();
              Team d6 = teamRepo.findByName("TEAM_KAPPA").orElseThrow();
              Team d7 = teamRepo.findByName("TEAM_LAMBDA").orElseThrow();
              Team d8 = teamRepo.findByName("TEAM_MU").orElseThrow();
              Team d9 = teamRepo.findByName("TEAM_NU").orElseThrow();
              Team d10 = teamRepo.findByName("TEAM_XI").orElseThrow();
              LocalDateTime b = t.getStartDate().atTime(10, 0);
              LocalDateTime b2 = b.plusDays(3);
              LocalDateTime b3 = b.plusDays(6);
              List<Match> ms = new ArrayList<>();
              // R1 - 7 real matches
              ms.add(makeFinishedMatch(t, iota, d0, 1, b, 3, 1, iota));
              ms.add(makeFinishedMatch(t, alpha, d1, 1, b.plusHours(2), 2, 1, alpha));
              ms.add(makeFinishedMatch(t, omega, d2, 1, b.plusHours(4), 3, 0, omega));
              ms.add(makeFinishedMatch(t, d3, d4, 1, b.plusHours(6), 2, 1, d3));
              ms.add(makeFinishedMatch(t, d5, d6, 1, b.plusHours(8), 3, 2, d5));
              ms.add(makeFinishedMatch(t, d7, d8, 1, b.plusHours(10), 2, 0, d7));
              ms.add(makeFinishedMatch(t, d9, d10, 1, b.plusHours(12), 3, 1, d9));
              // R2 - 3 real matches + BYE
              ms.add(makeFinishedMatch(t, iota, alpha, 2, b2, 2, 1, iota));
              ms.add(makeFinishedMatch(t, omega, d3, 2, b2.plusHours(2), 3, 2, omega));
              ms.add(makeFinishedMatch(t, d5, d7, 2, b2.plusHours(4), 2, 1, d5));
              ms.add(makeByeMatch(t, d9, 2));
              // R3
              ms.add(makeFinishedMatch(t, iota, omega, 3, b3, 2, 1, iota));
              ms.add(makeFinishedMatch(t, d5, d9, 3, b3.plusHours(2), 3, 1, d5));
              // Finale - iota wins
              ms.add(makeFinishedMatch(t, iota, d5, 4, t.getEndDate().atTime(10, 0), 3, 2, iota));
              matchRepo.saveAll(ms);
              t.setMatchSchedulePublished(true);
              tournamentRepo.save(t);
            });

    // Vinci Winter Clash 2026 - 12 teams, winner = TEAM_ALPHA
    tournamentRepo
        .findByName("Vinci Winter Clash 2026")
        .ifPresent(
            t -> {
              if (!matchRepo.findByTournamentId(t.getId()).isEmpty()) {
                return;
              }
              Team alpha = teamRepo.findByName("TEAM_ALPHA").orElseThrow();
              Team omega = teamRepo.findByName("TEAM_OMEGA").orElseThrow();
              Team iota = teamRepo.findByName("TEAM_IOTA").orElseThrow();
              Team d0 = teamRepo.findByName("TEAM_BETA").orElseThrow();
              Team d1 = teamRepo.findByName("TEAM_GAMMA").orElseThrow();
              Team d2 = teamRepo.findByName("TEAM_DELTA").orElseThrow();
              Team d3 = teamRepo.findByName("TEAM_EPSILON").orElseThrow();
              Team d4 = teamRepo.findByName("TEAM_ZETA").orElseThrow();
              Team d5 = teamRepo.findByName("TEAM_THETA").orElseThrow();
              Team d6 = teamRepo.findByName("TEAM_KAPPA").orElseThrow();
              Team d7 = teamRepo.findByName("TEAM_LAMBDA").orElseThrow();
              Team d8 = teamRepo.findByName("TEAM_MU").orElseThrow();
              LocalDateTime b = t.getStartDate().atTime(10, 0);
              LocalDateTime b2 = b.plusDays(3);
              LocalDateTime b3 = b.plusDays(6);
              List<Match> ms = new ArrayList<>();
              // R1 - 6 real matches
              ms.add(makeFinishedMatch(t, alpha, d0, 1, b, 3, 1, alpha));
              ms.add(makeFinishedMatch(t, omega, d1, 1, b.plusHours(2), 2, 1, omega));
              ms.add(makeFinishedMatch(t, iota, d2, 1, b.plusHours(4), 3, 0, iota));
              ms.add(makeFinishedMatch(t, d3, d4, 1, b.plusHours(6), 2, 1, d3));
              ms.add(makeFinishedMatch(t, d5, d6, 1, b.plusHours(8), 3, 2, d5));
              ms.add(makeFinishedMatch(t, d7, d8, 1, b.plusHours(10), 2, 0, d7));
              // R2 - 3 real matches
              ms.add(makeFinishedMatch(t, alpha, omega, 2, b2, 2, 1, alpha));
              ms.add(makeFinishedMatch(t, iota, d3, 2, b2.plusHours(2), 3, 1, iota));
              ms.add(makeFinishedMatch(t, d5, d7, 2, b2.plusHours(4), 2, 1, d5));
              // R3 - 1 real match + BYE (alpha vs iota, d5 gets BYE)
              ms.add(makeFinishedMatch(t, alpha, iota, 3, b3, 2, 1, alpha));
              ms.add(makeByeMatch(t, d5, 3));
              // Finale - alpha wins
              ms.add(makeFinishedMatch(t, alpha, d5, 4, t.getEndDate().atTime(10, 0), 3, 2, alpha));
              matchRepo.saveAll(ms);
              t.setMatchSchedulePublished(true);
              tournamentRepo.save(t);
            });
  }

  /** Common seeded entities returned to subclasses for profile-specific extras. */
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
      Tournament elite2026) {}
}
