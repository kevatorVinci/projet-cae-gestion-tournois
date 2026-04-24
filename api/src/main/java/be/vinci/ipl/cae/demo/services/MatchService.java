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

/**
 * Service class handling the business logic for matches.
 */
@Service
public class MatchService {

  private final MatchRepository matchRepository;
  private final MatchResultRepository matchResultRepository;
  private final TournamentRepository tournamentRepository;
  private final InscriptionEquipeTournoiRepository inscriptionRepository;
  private final NotificationService notificationService;

  /**
   * Constructor.
   *
   * @param matchRepository       the repository for matches.
   * @param matchResultRepository the repository for match results.
   * @param tournamentRepository  the repository for tournaments.
   * @param inscriptionRepository the repository for registrations.
   */
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

  /**
   * Finds a match by its ID.
   *
   * @param id The ID of the match to find.
   * @return The found match or null.
   */
  public Match getOne(Long id) {
    return matchRepository.findById(id).orElse(null);
  }

  /**
   * Saves or updates a match in the database.
   *
   * @param match The match object to save.
   * @return The saved match entity.
   */
  public Match saveOne(Match match) {
    return matchRepository.save(match);
  }

  /**
   * Publishes the generated schedule so it becomes public.
   *
   * @param tournamentId the unique identifier of the tournament.
   */
  public void publishTournamentSchedule(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId)
        .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    List<Match> matches = matchRepository
        .findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);

    if (matches.isEmpty()) {
      throw new IllegalStateException(
          "Aucun planning généré. Générez les matchs avant publication.");
    }

    tournament.setMatchSchedulePublished(true);
    tournamentRepository.save(tournament);
  }

  /**
   * Returns all matches for a specific tournament.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @return a list of matches belonging to the tournament.
   */
  public List<Match> getTournamentMatches(Long tournamentId) {
    return matchRepository
        .findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
  }

  /**
   * Returns tournament matches only when the schedule is public.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @return public matches, or empty list if schedule is not published.
   */
  public List<Match> getTournamentPublicMatches(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId)
        .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    if (!tournament.isMatchSchedulePublished()) {
      return List.of();
    }
    return matchRepository
        .findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
  }

  /**
   * Generates the schedule for a tournament using standard bracket seeding.
   * Bye matches are immediately resolved and their winners advance to the next round.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @param admin        the admin user responsible for the schedule.
   * @return the list of created matches.
   */
  public List<Match> generateSchedule(Long tournamentId, User admin) {
    Tournament tournament = tournamentRepository.findById(tournamentId)
        .orElseThrow(() -> new IllegalStateException("Tournament not found."));

    List<Match> existing = matchRepository
        .findByTournamentIdOrderByRoundAscScheduledDateTimeAscIdAsc(tournamentId);
    if (!existing.isEmpty()) {
      throw new IllegalStateException("Schedule has already been generated.");
    }

    List<Team> teams = inscriptionRepository.findByTournament(tournament)
        .stream()
        .map(RegistrationTeamTournament::getTeam)
        .collect(Collectors.toList());

    int teamCount = teams.size();
    if (teamCount < 2) {
      throw new IllegalStateException(
          "Not enough registered teams (minimum 2).");
    }

    Collections.shuffle(teams);

    int bracketSize = nextPowerOfTwo(teamCount);
    int[] seeds = bracketSeeds(bracketSize);

    int totalRounds = Integer.numberOfTrailingZeros(bracketSize);
    List<Match> matches = new ArrayList<>();

    // Round 1 : équipes réelles, 2h d'écart entre chaque match
    LocalDateTime matchDate = tournament.getStartDate().atTime(10, 0);
    List<Match> round1Matches = new ArrayList<>();
    for (int i = 0; i < bracketSize; i += 2) {
      int seed1 = seeds[i];
      int seed2 = seeds[i + 1];

      Team team1 = seed1 <= teamCount ? teams.get(seed1 - 1) : null;
      Team team2 = seed2 <= teamCount ? teams.get(seed2 - 1) : null;

      if (team1 == null && team2 == null) {
        continue;
      }
      // Ensure team1 is always the real team for bye matches
      if (team1 == null) {
        team1 = team2;
        team2 = null;
      }

      Match match = new Match();
      match.setTournament(tournament);
      match.setTeam1(team1);
      match.setTeam2(team2);
      match.setRound(1);
      match.setScheduledDateTime(matchDate);
      match.setAdminResponsible(admin);
      Match saved = matchRepository.save(match);
      round1Matches.add(saved);
      matches.add(saved);
      matchDate = matchDate.plusHours(2);
    }

    // Rounds 2+ : toujours créer des matchs vides (les équipes seront remplies à l'avancement)
    for (int round = 2; round <= totalRounds; round++) {
      int matchesInRound = bracketSize / (1 << round);
      LocalDateTime roundStart = tournament.getStartDate().atTime(10, 0)
          .plusDays((long) (round - 1) * 2);
      for (int i = 0; i < matchesInRound; i++) {
        Match match = new Match();
        match.setTournament(tournament);
        match.setTeam1(null);
        match.setTeam2(null);
        match.setRound(round);
        match.setScheduledDateTime(roundStart);
        match.setAdminResponsible(admin);
        matches.add(matchRepository.save(match));
        roundStart = roundStart.plusHours(2);
      }
    }

    // Résoudre immédiatement les matchs byes et avancer l'équipe qualifiée d'office
    for (Match byeMatch : round1Matches) {
      if (byeMatch.getTeam1() != null && byeMatch.getTeam2() == null) {
        finishByeMatch(byeMatch, admin);
      }
    }

    return matches;
  }

  /**
   * Terminates a bye match immediately and advances the team to the next round.
   */
  private void finishByeMatch(Match byeMatch, User admin) {
    byeMatch.setStatus("FINISHED");
    matchRepository.save(byeMatch);

    MatchResult byeResult = new MatchResult();
    byeResult.setMatch(byeMatch);
    byeResult.setScoreTeam1(1);
    byeResult.setScoreTeam2(0);
    byeResult.setEncodingDate(LocalDateTime.now());
    byeResult.setAdminEncoder(admin);
    byeResult.setValidationStatusTeam1("VALIDATED");
    byeResult.setValidationStatusTeam2("VALIDATED");
    matchResultRepository.save(byeResult);

    advanceWinnerToNextRound(byeMatch, byeMatch.getTeam1());
  }

  /**
   * Places the winner of a finished match into the correct slot of the next-round match.
   *
   * @param finishedMatch the match that just finished.
   * @param winner        the winning team.
   */
  public void advanceWinnerToNextRound(Match finishedMatch, Team winner) {
    if (winner == null) {
      return;
    }

    Long tournamentId = finishedMatch.getTournament().getId();
    int currentRound = finishedMatch.getRound();

    List<Match> currentRoundMatches = matchRepository
        .findByTournamentIdAndRoundOrderByScheduledDateTimeAscIdAsc(tournamentId, currentRound);

    int matchIndex = -1;
    for (int i = 0; i < currentRoundMatches.size(); i++) {
      if (currentRoundMatches.get(i).getId().equals(finishedMatch.getId())) {
        matchIndex = i;
        break;
      }
    }
    if (matchIndex == -1) {
      return;
    }

    List<Match> nextRoundMatches = matchRepository
        .findByTournamentIdAndRoundOrderByScheduledDateTimeAscIdAsc(tournamentId, currentRound + 1);

    int nextMatchIndex = matchIndex / 2;
    if (nextMatchIndex >= nextRoundMatches.size()) {
      return;
    }

    Match nextMatch = nextRoundMatches.get(nextMatchIndex);
    if (matchIndex % 2 == 0) {
      nextMatch.setTeam1(winner);
    } else {
      nextMatch.setTeam2(winner);
    }
    matchRepository.save(nextMatch);
  }

  /**
   * Returns the smallest power of two greater than or equal to n.
   */
  private int nextPowerOfTwo(int n) {
    int power = 1;
    while (power < n) {
      power <<= 1;
    }
    return power;
  }

  /**
   * Generates the standard single-elimination bracket seed order for a given bracket size.
   * Example for size 8: [1, 8, 4, 5, 2, 7, 3, 6] → matches (1v8), (4v5), (2v7), (3v6).
   */
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

  /**
   * Returns all matches a specific team has played or will play.
   *
   * @param teamId the unique identifier of the team.
   * @return a list of matches involving the team.
   */
  public List<Match> getMatchesByTeam(Long teamId) {
    return matchRepository.findByTeam1IdOrTeam2Id(teamId, teamId)
        .stream()
        .filter(match -> match.getTournament() != null
            && match.getTournament().isMatchSchedulePublished())
        .toList();
  }

  /**
   * Declares a forfeit for a team in a match.
   * The forfeiting team loses 0-5 and is eliminated.
   *
   * @param matchId   the ID of the match.
   * @param teamId    the ID of the team declaring forfeit.
   * @param adminUser the user responsible for the forfeit.
   */
  public MatchResult declareForfeit(Long matchId, Long teamId, User adminUser) {
    Match match = matchRepository.findById(matchId)
        .orElseThrow(() -> new IllegalStateException("Match introuvable."));

    boolean isTeam1 = match.getTeam1() != null
        && match.getTeam1().getId().equals(teamId);
    boolean isTeam2 = match.getTeam2() != null
        && match.getTeam2().getId().equals(teamId);

    if (!isTeam1 && !isTeam2) {
      throw new IllegalStateException("Cette équipe ne participe pas à ce match.");
    }

    MatchResult result = match.getResult() != null
        ? match.getResult()
        : new MatchResult();
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

    Team forfeitingTeam = isTeam1 ? match.getTeam1() : match.getTeam2();
    Team winningTeam = isTeam1 ? match.getTeam2() : match.getTeam1();
    String tournamentName = match.getTournament() != null
        ? match.getTournament().getName()
        : "Tournoi";

    List<User> members = forfeitingTeam.getMembers();
    if (members != null && !members.isEmpty()) {
      notificationService.notifyForfeit(members, tournamentName);
    }

    MatchResult savedResult = matchResultRepository.save(result);
    advanceWinnerToNextRound(match, winningTeam);
    return savedResult;
  }
}
