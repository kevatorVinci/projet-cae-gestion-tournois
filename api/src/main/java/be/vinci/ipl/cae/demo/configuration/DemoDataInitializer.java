package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
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

  @Override
  @Transactional
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    boolean shouldSeedBase = prepareBaseSeed(pwd);

    if (shouldSeedBase) {
      SeedData data = seedBaseData(pwd);
      ensureDemoTournaments(data);
      // 🔥 Lancement de la génération massive des cas de tests de la checklist
      seedMassiveChecklistData(pwd, data); 
    } else {
      ensureDemoTournaments(null);
    }

    System.out.println(
        "[demo] DB initialized: Upcoming tournaments and ALL EDGE CASES ready for testing."
    );
  }

  /**
   * 🔥 GÉNÉRATION DE TOUS LES CAS DE TESTS POUR LA DÉMO (Itérations 1 & 2)
   */
  private void seedMassiveChecklistData(String pwd, SeedData baseData) {
    System.out.println("[demo] Generating massive checklist test data...");

    // ─────────────────────────────────────────────────────────────────
    // 1. CRÉATION DES UTILISATEURS SPÉCIFIQUES
    // ─────────────────────────────────────────────────────────────────
    User min4Lead = saveUser(makeUser("min4.leadmail.com", "Min4Lead", "tacticien", "2026-01-01", false, pwd, "default.png"));
    User min4P2 = saveUser(makeUser("min4.p2@demo.com", "Min4P2", "exécuteur", "2026-01-01", false, pwd, "default.png"));
    User min4P3 = saveUser(makeUser("min4.p3@demo.com", "Min4P3", "gardien", "2026-01-01", false, pwd, "default.png"));
    User min4P4 = saveUser(makeUser("min4.p4@demo.com", "Min4P4", "guérisseur", "2026-01-01", false, pwd, "default.png"));

    User min3Lead = saveUser(makeUser("min3.leadmail.com", "Min3Lead", "tacticien", "2026-01-01", false, pwd, "default.png"));
    User min3P2 = saveUser(makeUser("min3.p2@demo.com", "Min3P2", "exécuteur", "2026-01-01", false, pwd, "default.png"));
    User min3P3 = saveUser(makeUser("min3.p3@demo.com", "Min3P3", "gardien", "2026-01-01", false, pwd, "default.png"));

    User dualLead1 = saveUser(makeUser("dual.lead1@demo.com", "DualLead1", "architecte", "2026-01-01", false, pwd, "default.png"));
    User dualLead2 = saveUser(makeUser("dual.lead2@demo.com", "DualLead2", "tacticien", "2026-01-01", false, pwd, "default.png"));
    User dualP3 = saveUser(makeUser("dual.p3@demo.com", "DualP3", "exécuteur", "2026-01-01", false, pwd, "default.png"));
    User dualP4 = saveUser(makeUser("dual.p4@demo.com", "DualP4", "gardien", "2026-01-01", false, pwd, "default.png"));

    User sigmaLead = saveUser(makeUser("sigma.lead@demo.com", "SigmaLead", "tacticien", "2026-01-01", false, pwd, "default.png"));
    User sigmaUnavailable = saveUser(makeUser("sigma.unavailablemail.com", "SigmaOff", "exécuteur", "2026-01-01", false, pwd, "default.png"));
    User sigmaP3 = saveUser(makeUser("sigma.p3@demo.com", "SigmaP3", "gardien", "2026-01-01", false, pwd, "default.png"));

    User tagDup = saveUser(makeUser("tagdup@demo.com", "Rogue", "architecte", "2026-01-01", false, pwd, "default.png"));

    // Joueurs seuls pour tester les demandes d'adhésion
    saveUser(makeUser("demand.pendingmail.com", "PendingPlayer", "exécuteur", "2026-01-01", false, pwd, "default.png"));
    saveUser(makeUser("demand.acceptedmail.com", "AcceptedPlayer", "gardien", "2026-01-01", false, pwd, "default.png"));
    saveUser(makeUser("demand.rejectedmail.com", "RejectedPlayer", "tacticien", "2026-01-01", false, pwd, "default.png"));

    User admin = baseData.lea(); // On réutilise un admin de la base

    // ─────────────────────────────────────────────────────────────────
    // 2. CRÉATION DES ÉQUIPES DE TESTS
    // ─────────────────────────────────────────────────────────────────
    Team teamMin4Ok = createTeam("TEAMMIN4OK", min4Lead, null, "default.png");
    setTeamForUsers(teamMin4Ok, min4Lead, min4P2, min4P3, min4P4);

    Team teamMin3Ko = createTeam("TEAMMIN3KO", min3Lead, null, "default.png");
    setTeamForUsers(teamMin3Ko, min3Lead, min3P2, min3P3);

    Team teamDualLead = createTeam("TEAMDUALLEAD", dualLead1, dualLead2, "default.png");
    setTeamForUsers(teamDualLead, dualLead1, dualLead2, dualP3, dualP4);

    Team teamSigmaShort = createTeam("TEAMSIGMASHORT", sigmaLead, null, "default.png");
    setTeamForUsers(teamSigmaShort, sigmaLead, sigmaUnavailable, sigmaP3);

    Team teamTagDupOk = createTeam("TEAMTAGDUPOK", tagDup, null, "default.png");
    setTeamForUsers(teamTagDupOk, tagDup);

    // ─────────────────────────────────────────────────────────────────
    // 3. CRÉATION DES TOURNOIS SPÉCIAUX
    // ─────────────────────────────────────────────────────────────────
    
    // Tournoi ouvert avec de la place
    Tournament devOpenSlots = getOrCreateTournament(
        "DEVOPENSLOTS", "Tournoi avec places dispo", "2026-09-01", "2026-09-15", "2026-08-20", "OUVERT", 16
    );
    registerTeams(devOpenSlots, List.of(baseData.alpha(), baseData.omega(), teamDualLead), "2026-05-01");

    // Tournoi avec EXACTEMENT 1 place restante (Max 4 équipes, 3 déjà inscrites)
    Tournament devOneSlotLeft = getOrCreateTournament(
      "DEVALERTE_1_PLACE", "Vite, il ne reste qu'une seule place !", "2026-12-01", "2026-12-15", "2026-11-20", "OUVERT", 4
    );
    // On inscrit 3 équipes (Alpha, Omega, Iota), il ne reste donc plus qu'une place pour 4
    registerTeams(devOneSlotLeft, List.of(baseData.alpha(), baseData.omega(), baseData.iota()), "2026-05-01");

    // Tournoi PLEIN (bloqué aux inscriptions)
    Tournament devFull = getOrCreateTournament(
        "DEVFULLTOURNAMENT", "Tournoi complet (4 max)", "2026-10-01", "2026-10-15", "2026-09-20", "OUVERT", 4
    );
    registerTeams(devFull, baseData.dummyTeams().subList(0, 4), "2026-05-01");

    // Tournoi CLOTURÉ avec un nombre IMPAIR (Bye system)
    Tournament devOdd = getOrCreateTournament(
        "DEVODDPLANNING", "5 équipes, test de génération de bracket impair", "2026-11-01", "2026-11-15", "2026-10-20", "CLOTURE", 8
    );
    registerTeams(devOdd, List.of(baseData.alpha(), baseData.iota(), teamDualLead, teamMin4Ok, teamSigmaShort), "2026-05-01");

    // Tournoi EN_COURS pour les tests de Matchs, Contestations et Forfaits
    Tournament forfeitTourney = getOrCreateTournament(
        "Forfeit & Match Tests", "Tournoi pour tester les états des matchs", "2026-04-01", "2026-04-30", "2026-03-20", "EN_COURS", 8
    );
    registerTeams(forfeitTourney, List.of(baseData.alpha(), baseData.omega(), baseData.iota(), teamMin4Ok, teamDualLead, teamSigmaShort), "2026-03-15");

    // ─────────────────────────────────────────────────────────────────
    // 4. CRÉATION DES MATCHS (ÉTATS SPÉCIFIQUES)
    // ─────────────────────────────────────────────────────────────────
    LocalDateTime april12 = LocalDateTime.of(2026, 4, 12, 18, 0);
    LocalDateTime april14 = LocalDateTime.of(2026, 4, 14, 18, 0);
    LocalDateTime april16 = LocalDateTime.of(2026, 4, 16, 18, 0);
    LocalDateTime futureMatch = LocalDateTime.of(2026, 4, 25, 18, 0);

    // Match 1 : WAITING VALIDATION (Score encodé, en attente de validation par les équipes)
    Match m1 = createMatch(forfeitTourney, baseData.alpha(), baseData.iota(), 1, april12, admin, "TERMINE");
    createCustomMatchResult(m1, 3, 2, admin, "VALIDATED", "WAITING"); // Alpha a validé, Iota doit encore valider

    // Match 2 : DISPUTED (Contesté)
    Match m2 = createMatch(forfeitTourney, baseData.omega(), teamSigmaShort, 1, april14, admin, "TERMINE");
    createCustomMatchResult(m2, 1, 3, admin, "DISPUTED", "VALIDATED"); // Omega conteste la victoire de Sigma

    // Match 3 : FINISHED (Résultat définitif après litige)
    Match m3 = createMatch(forfeitTourney, baseData.alpha(), teamSigmaShort, 2, april16, admin, "TERMINE");
    createCustomMatchResult(m3, 3, 0, admin, "VALIDATED", "VALIDATED"); // Forcé et définitif

    // Match 4 : PENDING (Match futur, prêt pour tester le Forfait par un responsable)
    createMatch(forfeitTourney, teamDualLead, teamMin4Ok, 1, futureMatch, admin, "PENDING");
  }

  // === Méthodes utilitaires ===

  private User saveUser(User u) {
    return userRepo.save(u);
  }

  private void setTeamForUsers(Team t, User... users) {
    for (User u : users) {
      u.setTeam(t);
      userRepo.save(u);
    }
  }

  /**
   * Crée un MatchResult avec des statuts de validation personnalisés pour tester le front-end.
   */
  private MatchResult createCustomMatchResult(Match match, int score1, int score2, User admin, String status1, String status2) {
    MatchResult result = new MatchResult();
    result.setMatch(match);
    result.setScoreTeam1(score1);
    result.setScoreTeam2(score2);
    result.setEncodingDate(LocalDateTime.now());
    result.setAdminEncoder(admin);
    result.setValidationStatusTeam1(status1); 
    result.setValidationStatusTeam2(status2);
    return matchResultRepo.save(result);
  }


  // ═══════════════════════════════════════════════════════════════════
  // ANCIEN CODE DU DEMODATAINITIALIZER (Conservé et intégré)
  // ═══════════════════════════════════════════════════════════════════

  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);

    Tournament t5 = getOrCreateTournament(
        "Demo Future Arena (5 Teams)", "Tournoi asymétrique", "2026-06-01", "2026-06-15", "2026-05-25", "CLOTURE", 8
    );
    ensureRegistrations(t5, registrationTeams.subList(0, 5), "2026-05-20");

    Tournament t6 = getOrCreateTournament(
        "Demo Future Arena (6 Teams)", "Tournoi asymétrique", "2026-06-10", "2026-06-25", "2026-06-05", "CLOTURE", 8
    );
    ensureRegistrations(t6, registrationTeams.subList(0, 6), "2026-06-01");

    Tournament t7 = getOrCreateTournament(
        "Demo Future Arena (7 Teams)", "Tournoi asymétrique", "2026-07-01", "2026-07-15", "2026-06-25", "CLOTURE", 8
    );
    ensureRegistrations(t7, registrationTeams.subList(0, 7), "2026-06-20");
  }

  private Tournament getOrCreateTournament(
      String name, String description, String startDate, String endDate, String registrationDeadline, String status, int maxParticipants) {
    return tournamentRepo.findByName(name).orElseGet(() -> {
      Tournament tournament = makeTournament(name, description, startDate, endDate, registrationDeadline, status, maxParticipants);
      return tournamentRepo.save(tournament);
    });
  }

  private void ensureRegistrations(Tournament tournament, List<Team> targetTeams, String date) {
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
        "TEAM_ALPHA", "TEAM_OMEGA", "TEAM_IOTA", "TEAM_BETA", "TEAM_GAMMA", "TEAM_DELTA", "TEAM_EPSILON", "TEAM_ZETA"
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
}