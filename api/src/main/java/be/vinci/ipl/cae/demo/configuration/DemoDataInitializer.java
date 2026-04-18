package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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
@SuppressWarnings("PMD.ExcessiveMethodLength")
public class DemoDataInitializer extends AbstractDataInitializer {

  private static final int CLOSED_TOURNAMENT_TEAM_CAP = 8;

  @Override
  public void run(String... args) {
    final String pwd = pwdEncoder.encode("Azerty2026!");

    boolean shouldSeedBase = prepareBaseSeed(pwd);
    SeedData data = null;

    if (shouldSeedBase) {
      data = seedBaseData(pwd);

      Team alpha = data.alpha();
      Team omega = data.omega();

      addBotMember("alphabot@demo.com", "AlphaBot", "architecte", pwd, "neon2.jpg", alpha);
      for (int j = 1; j <= 3; j++) {
        addBotMember("omegabot" + j + "@demo.com",
            "OmegaBot" + j, "gardien", pwd, "kaido.png", omega);
      }
    }

    ensureDemoTournaments(data);
    ensureMatchHistory();

    System.out.println("[demo] DB initialized/updated: tournois demo vérifiés "
        + "(4 tournois CLOTURE supplémentaires en 8/8).");
  }

  private void ensureDemoTournaments(SeedData data) {
    List<Team> registrationTeams = resolveRegistrationTeams(data);
    if (registrationTeams.size() < CLOSED_TOURNAMENT_TEAM_CAP) {
      System.out.println("[demo] Impossible de créer les tournois 8/8: "
          + "moins de 8 équipes disponibles.");
      return;
    }

    Tournament springShowdown = getOrCreateTournament(
        "Vinci Spring Showdown 2026",
          "Tournoi clôturé de démonstration avec 5 équipes inscrites sur 8",
        "2026-04-20", "2026-05-05", "2026-04-09", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(springShowdown, registrationTeams.subList(0, 5), "2026-04-07");

    getOrCreateTournament(
        "Summer Invitational 2026",
        "Tournoi estival en préparation, pas encore publié",
        "2026-07-01", "2026-07-15", "2026-06-20", "BROUILLON", 12);

    Tournament closedArenaOne = getOrCreateTournament(
        "Demo Closed Arena I",
        "Tournoi de démonstration clôturé (8/8 équipes).",
        "2026-06-01", "2026-06-06", "2026-05-25", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(closedArenaOne, registrationTeams.subList(0, 8), "2026-05-23");

    Tournament closedArenaTwo = getOrCreateTournament(
        "Demo Closed Arena II",
        "Tournoi de démonstration clôturé (8/8 équipes).",
        "2026-06-08", "2026-06-13", "2026-06-01", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(closedArenaTwo, registrationTeams.subList(0, 8), "2026-05-30");

    Tournament closedArenaThree = getOrCreateTournament(
        "Demo Closed Arena III",
        "Tournoi de démonstration clôturé (8/8 équipes).",
        "2026-06-15", "2026-06-20", "2026-06-08", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(closedArenaThree, registrationTeams.subList(0, 8), "2026-06-06");

    Tournament closedArenaFour = getOrCreateTournament(
        "Demo Closed Arena IV",
        "Tournoi de démonstration clôturé (8/8 équipes).",
        "2026-06-22", "2026-06-27", "2026-06-15", "CLOTURE", CLOSED_TOURNAMENT_TEAM_CAP);
    ensureRegistrations(closedArenaFour, registrationTeams.subList(0, 8), "2026-06-13");
  }

  private List<Team> resolveRegistrationTeams(SeedData data) {
    if (data != null) {
      List<Team> teams = new ArrayList<>(
          List.of(data.alpha(), data.omega(), data.iota()));
      teams.addAll(data.dummyTeams());
      return teams;
    }

    List<Team> teams = new ArrayList<>();
    for (Team team : teamRepo.findByMembersIsNotEmpty()) {
      teams.add(team);
    }
    teams.sort(Comparator.comparing(Team::getId));
    return teams;
  }

  private Tournament getOrCreateTournament(
      String name,
      String description,
      String startDate,
      String endDate,
      String registrationDeadline,
      String status,
      int maxParticipants) {
    Optional<Tournament> existing = tournamentRepo.findByName(name);
    if (existing.isPresent()) {
      Tournament tournament = existing.get();
      tournament.setDescription(description);
      tournament.setStartDate(java.time.LocalDate.parse(startDate));
      tournament.setEndDate(java.time.LocalDate.parse(endDate));
      tournament.setRegistrationDeadline(java.time.LocalDate.parse(registrationDeadline));
      tournament.setStatus(status);
      tournament.setMaxParticipants(maxParticipants);
      return tournamentRepo.save(tournament);
    }

    Tournament created = makeTournament(
        name,
        description,
        startDate,
        endDate,
        registrationDeadline,
        status,
        maxParticipants);
    return tournamentRepo.save(created);
  }

  private void ensureRegistrations(Tournament tournament, List<Team> teams, String date) {
    for (Team team : teams) {
      boolean exists = inscriptionRepo.findByTournamentAndTeam(tournament, team).isPresent();
      if (!exists) {
        registerTeams(tournament, List.of(team), date);
      }
    }
  }
}
