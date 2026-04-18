package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a rich, client-facing demo dataset.
 * Includes the full dev dataset plus extra teams with 4+ members each,
 * and two additional tournaments (one CLOTURE, one BROUILLON).
 * Activated only when the "demo" Spring profile is active.
 */
@Component
@Profile("demo")
public class DemoDataInitializer extends AbstractDataInitializer {

  private static final int CLOSED_TOURNAMENT_TEAM_CAP = 8;

  /**
   * Executes the data initialization for the demo profile.
   *
   * @param args command line arguments
   */
  @Override
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    boolean shouldSeedBase = prepareBaseSeed(pwd);

    if (shouldSeedBase) {
      SeedData data = seedBaseData(pwd);

      Team alpha = data.alpha();
      Team omega = data.omega();

      addBotMember("alphabot@demo.com", "AlphaBot", "architecte", pwd, "neon2.jpg", alpha);
      for (int j = 1; j <= 3; j++) {
        addBotMember("omegabot" + j + "@demo.com",
            "OmegaBot" + j, "gardien", pwd, "kaido.png", omega);
      }

      ensureDemoTournaments(data);
    } else {
      ensureDemoTournaments(null);
    }

    System.out.println("[demo] DB initialized/updated: demo tournaments verified.");
  }

  /**
   * Ensures the specific demo tournaments are present in the database.
   * If seed data is provided, registers teams to the Showdown tournament.
   *
   * @param data the seeded base data, or null if the DB was already seeded.
   */
  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);

    Tournament closedEight = getOrCreateTournament(
        "Demo Closed Arena 8v8 2026",
        "Tournoi clôturé de démonstration avec 8 équipes inscrites sur 8",
        "2026-04-20",
        "2026-05-05",
        "2026-04-09",
        "CLOTURE",
        CLOSED_TOURNAMENT_TEAM_CAP
    );
    ensureRegistrations(closedEight, registrationTeams.subList(0, 8), "2026-04-07");

    Tournament closedSeven = getOrCreateTournament(
        "Demo Closed Arena 7v8 2026",
        "Tournoi clôturé de démonstration avec 7 équipes inscrites sur 8",
        "2026-05-10",
        "2026-05-20",
        "2026-05-03",
        "CLOTURE",
        CLOSED_TOURNAMENT_TEAM_CAP
    );
    ensureRegistrations(closedSeven, registrationTeams.subList(0, 7), "2026-05-01");

    Tournament closedSix = getOrCreateTournament(
        "Demo Closed Arena 6v8 2026",
        "Tournoi clôturé de démonstration avec 6 équipes inscrites sur 8",
        "2026-05-25",
        "2026-06-05",
        "2026-05-18",
        "CLOTURE",
        CLOSED_TOURNAMENT_TEAM_CAP
    );
    ensureRegistrations(closedSix, registrationTeams.subList(0, 6), "2026-05-16");

    if (tournamentRepo.findByName("Summer Invitational 2026").isEmpty()) {
      Tournament summerInvitational = makeTournament(
          "Summer Invitational 2026",
          "Summer tournament in preparation, not yet published",
          "2026-07-01",
          "2026-07-15",
          "2026-06-20",
          "BROUILLON",
          12
      );
      tournamentRepo.save(summerInvitational);
    }

    System.out.println(
        "[demo] DB initialized: planning tournaments ready (CLOTURE 8/8, 7/8, 6/8 + 1 BROUILLON)"
    );
  }

  /**
   * Returns an existing tournament by name or creates it if absent.
   */
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

  /**
   * Ensures all given teams are registered once in the target tournament.
   */
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

  /**
   * Resolves at least 8 teams for tournament registrations.
   */
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

    throw new IllegalStateException("Not enough teams to seed demo planning tournaments.");
  }

  /**
   * Adds a team to the target list only once.
   */
  private void addIfAbsent(List<Team> target, Set<Long> seen, Team team) {
    if (team != null && team.getId() != null && seen.add(team.getId())) {
      target.add(team);
    }
  }
}