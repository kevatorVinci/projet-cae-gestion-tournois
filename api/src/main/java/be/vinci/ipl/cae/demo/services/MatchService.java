package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Service class handling the business logic for matches. */
@Service
public class MatchService {

  private final MatchRepository matchRepository;
  private final MatchResultRepository matchResultRepository;
  private final TournamentRepository tournamentRepository;
  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final NotificationService notificationService;

  /** Builds the match service. */
  public MatchService(
      MatchRepository matchRepository,
      MatchResultRepository matchResultRepository,
      TournamentRepository tournamentRepository,
      InscriptionEquipeTournoiRepository inscriptionRepository,
      NotificationService notificationService) {
    this.matchRepository = matchRepository;
    this.matchResultRepository = matchResultRepository;
    this.tournamentRepository = tournamentRepository;
    this.inscriptionRepository = inscriptionRepository;
    this.notificationService = notificationService;
  }

  /** Finds one match by id. */
  public Match getOne(Long id) {
    return matchRepository.findById(id).orElse(null);
  }

  /** Persists one match. */
  public Match saveOne(Match match) {
    return matchRepository.save(match);
  }

  /** Publishes the schedule of a tournament. */
  public void publishTournamentSchedule(Long tournamentId) {
    Tournament tournament =
        tournamentRepository
            .findById(tournamentId)
            .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    List<Match> matches =
        matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);

    if (matches.isEmpty()) {
      throw new IllegalStateException(
          "Aucun planning généré. Générez les matchs avant publication.");
    }

    tournament.setMatchSchedulePublished(true);
    tournamentRepository.save(tournament);
  }

  /** Returns all matches of a tournament. */
  public List<Match> getTournamentMatches(Long tournamentId) {
    return matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
  }

  /** Returns public matches only when schedule is published. */
  public List<Match> getTournamentPublicMatches(Long tournamentId) {
    Tournament tournament =
        tournamentRepository
            .findById(tournamentId)
            .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    if (!tournament.isMatchSchedulePublished()) {
      return List.of();
    }
    return matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
  }

  /** Generates an elimination schedule for a tournament. */
  public List<Match> generateSchedule(Long tournamentId, User admin) {
    Tournament tournament =
        tournamentRepository
            .findById(tournamentId)
            .orElseThrow(() -> new IllegalStateException("Tournament not found."));

    List<Match> existing =
        matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
    if (!existing.isEmpty()) {
      throw new IllegalStateException("Schedule has already been generated.");
    }

    List<Team> teams =
        inscriptionRepository.findByTournament(tournament).stream()
            .map(RegistrationTeamTournament::getTeam)
            .collect(Collectors.toList());

    int teamCount = teams.size();
    if (teamCount < 2) {
      throw new IllegalStateException("Not enough registered teams (minimum 2).");
    }

    Collections.shuffle(teams);

    int bracketSize = nextPowerOfTwo(teamCount);
    int[] seeds = bracketSeeds(bracketSize);
    List<Match> matches = new ArrayList<>();
    List<BracketNode> previousRound = new ArrayList<>();

    // Round 1 : équipes réelles, 2h d'écart entre chaque match
    for (int i = 0; i < bracketSize; i += 2) {
      int seed1 = seeds[i];
      int seed2 = seeds[i + 1];

      Team team1 = seed1 <= teamCount ? teams.get(seed1 - 1) : null;
      Team team2 = seed2 <= teamCount ? teams.get(seed2 - 1) : null;

      Match match = createScheduledMatch(tournament, team1, team2, 1, i / 2, admin, true);
      matches.add(match);

      // Bye match: team is already qualified, propagate winner directly at generation time
      Team autoQualifiedWinner = match.getTeam2() == null ? match.getTeam1() : null;
      previousRound.add(new BracketNode(match, autoQualifiedWinner));
    }

    int roundNumber = 2;
    while (previousRound.size() > 1) {
      List<BracketNode> nextRound = new ArrayList<>();

      for (int i = 0; i < previousRound.size(); i += 2) {
        BracketNode leftNode = previousRound.get(i);
        BracketNode rightNode = i + 1 < previousRound.size() ? previousRound.get(i + 1) : null;

        Team leftTeam = leftNode.resolvedWinner();
        Team rightTeam = rightNode == null ? null : rightNode.resolvedWinner();

        Match match =
            createScheduledMatch(
                tournament, leftTeam, rightTeam, roundNumber, i / 2, admin, false);
        matches.add(match);

        nextRound.add(new BracketNode(match, null));
      }

      previousRound = nextRound;
      roundNumber++;
    }

    return matches;
  }

  private int nextPowerOfTwo(int n) {
    int power = 1;
    while (power < n) {
      power <<= 1;
    }
    return power;
  }

  private int[] bracketSeeds(int size) {
    int[] seeds = {1};
    while (seeds.length < size) {
      int len = seeds.length;
      int nextSize = len * 2;
      int[] expanded = new int[nextSize];
      for (int i = 0; i < len; i++) {
        expanded[i * 2] = seeds[i];
        expanded[i * 2 + 1] = nextSize + 1 - seeds[i];
      }
      seeds = expanded;
    }
    return seeds;
  }

  private Match createScheduledMatch(
      Tournament tournament,
      Team team1,
      Team team2,
      int round,
      int matchIndex,
      User admin,
      boolean normalizeSingleTeamAsBye) {
    if (normalizeSingleTeamAsBye && team1 == null && team2 != null) {
      team1 = team2;
      team2 = null;
    }

    LocalDateTime matchDate =
        tournament.getStartDate().atTime(10, 0).plusDays(round - 1L).plusHours(matchIndex * 2L);

    Match match = new Match();
    match.setTournament(tournament);
    match.setTeam1(team1);
    match.setTeam2(team2);
    match.setRound(round);
    match.setScheduledDateTime(matchDate);
    match.setAdminResponsible(admin);
    return matchRepository.save(match);
  }

  /** Returns all matches where the team participates. */
  public List<Match> getMatchesByTeam(Long teamId) {
    return matchRepository.findByTeam1IdOrTeam2Id(teamId, teamId).stream()
        .filter(
            match ->
                match.getTournament() != null && match.getTournament().isMatchSchedulePublished())
        .toList();
  }

  /** Declares a forfeit and encodes the resulting score. */
  public MatchResult declareForfeit(Long matchId, Long teamId, User adminUser) {
    Match match =
        matchRepository
            .findById(matchId)
            .orElseThrow(() -> new IllegalStateException("Match introuvable."));

    boolean isTeam1 = match.getTeam1() != null && match.getTeam1().getId().equals(teamId);
    boolean isTeam2 = match.getTeam2() != null && match.getTeam2().getId().equals(teamId);

    if (!isTeam1 && !isTeam2) {
      throw new IllegalStateException("Cette équipe ne participe pas à ce match.");
    }

    MatchResult result = match.getResult() != null ? match.getResult() : new MatchResult();
    result.setMatch(match);
    result.setEncodingDate(LocalDateTime.now());
    result.setAdminEncoder(adminUser);

    if (isTeam1) {
      result.setForfeitTeam1(true);
      result.setScoreTeam1(0);
      result.setScoreTeam2(5);
      result.setValidationStatusTeam1("VALIDATED");
      result.setValidationStatusTeam2("VALIDATED");
    } else {
      result.setForfeitTeam2(true);
      result.setScoreTeam1(5);
      result.setScoreTeam2(0);
      result.setValidationStatusTeam1("VALIDATED");
      result.setValidationStatusTeam2("VALIDATED");
    }

    match.setStatus("FINISHED");
    matchRepository.save(match);

    MatchResult savedResult = matchResultRepository.save(result);
    advanceWinnerToNextRound(match, savedResult);

    Team forfeitingTeam = isTeam1 ? match.getTeam1() : match.getTeam2();
    String tournamentName =
        match.getTournament() != null ? match.getTournament().getName() : "Tournoi";

    List<User> members = forfeitingTeam.getMembers();
    if (members != null && !members.isEmpty()) {
      notificationService.notifyForfeit(members, tournamentName);
    }

    return savedResult;
  }

  private record BracketNode(Match match, Team resolvedWinner) {}

  /** Advances the winner of a finished match into the next bracket round. */
  public void advanceWinnerToNextRound(Match match, MatchResult result) {
    if (match == null || result == null || match.getTournament() == null) {
      return;
    }

    Team winner = null;
    if (result.getScoreTeam1() > result.getScoreTeam2()) {
      winner = match.getTeam1();
    } else if (result.getScoreTeam2() > result.getScoreTeam1()) {
      winner = match.getTeam2();
    }

    if (winner == null) {
      return;
    }

    Integer currentRound = match.getRound();
    if (currentRound == null) {
      return;
    }
    int nextRound = currentRound + 1;

    List<Match> allMatches =
        matchRepository.findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(
            match.getTournament().getId());

    List<Match> currentRoundMatches =
        allMatches.stream().filter(m -> currentRound.equals(m.getRound())).toList();

    List<Match> nextRoundMatches =
        allMatches.stream().filter(m -> Integer.valueOf(nextRound).equals(m.getRound())).toList();

    int matchIndex = -1;
    for (int i = 0; i < currentRoundMatches.size(); i++) {
      if (currentRoundMatches.get(i).getId().equals(match.getId())) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex == -1) {
      return;
    }

    if (nextRoundMatches.isEmpty()) {
      Tournament tournament = match.getTournament();
      tournament.setWinner(winner);
      tournament.setStatus("TERMINE");
      tournamentRepository.save(tournament);
      return;
    }

    int targetMatchIndex = matchIndex / 2;
    if (targetMatchIndex >= nextRoundMatches.size()) {
      return;
    }

    Match nextMatch = nextRoundMatches.get(targetMatchIndex);

    if (matchIndex % 2 == 0) {
      nextMatch.setTeam1(winner);
    } else {
      nextMatch.setTeam2(winner);
    }

    matchRepository.save(nextMatch);
  }
}
