package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo-only tournaments and registrations on top of the shared base dataset.
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
    } else {
      ensureDemoTournaments(null);
    }

    System.out.println(
        "[demo] DB initialized: Upcoming tournaments ready to be planned by admin."
    );
  }

  /**
   * Ensures the dedicated demo tournaments exist with expected team registrations.
   *
   * @param data shared seed data when base seeding happened in this run, otherwise null.
   */
  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);

    Tournament t5 = getOrCreateTournament(
        "Demo Future Arena (5 Teams)",
        "Tournoi asymétrique prêt à être planifié",
        "2026-06-01",
        "2026-06-15",
        "2026-05-25",
        "CLOTURE",
        8
    );
    ensureRegistrations(t5, registrationTeams.subList(0, 5), "2026-05-20");

    Tournament t6 = getOrCreateTournament(
        "Demo Future Arena (6 Teams)",
        "Tournoi asymétrique prêt à être planifié",
        "2026-06-10",
        "2026-06-25",
        "2026-06-05",
        "CLOTURE",
        8
    );
    ensureRegistrations(t6, registrationTeams.subList(0, 6), "2026-06-01");

    Tournament t7 = getOrCreateTournament(
        "Demo Future Arena (7 Teams)",
        "Tournoi asymétrique prêt à être planifié",
        "2026-07-01",
        "2026-07-15",
        "2026-06-25",
        "CLOTURE",
        8
    );
    ensureRegistrations(t7, registrationTeams.subList(0, 7), "2026-06-20");

    System.out.println(
        "[demo] CLOTURE tournaments successfully seeded (5, 6, and 7 teams). "
            + "Ready for manual planning generation."
    );
  }

  /**
   * Returns the existing tournament with the given name or creates it.
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
   * Registers only teams that are still missing from the tournament.
   */
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

  /**
   * Resolves at least eight teams for demo tournament registration.
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

    throw new IllegalStateException("Pas assez d'équipes pour générer la démo.");
  }

  /**
   * Adds a team only once based on its id.
   */
  private void addIfAbsent(List<Team> target, Set<Long> seen, Team team) {
    if (team != null && team.getId() != null && seen.add(team.getId())) {
      target.add(team);
    }
  }
}
