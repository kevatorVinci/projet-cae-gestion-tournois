package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service class handling the business logic for matches.
 */
@Service
public class MatchService {

  private final MatchRepository matchRepository;
  private final TournamentRepository tournamentRepository;
  private final InscriptionEquipeTournoiRepository inscriptionRepository;

  /**
   * Constructor.
   *
   * @param matchRepository       the repository for matches.
   * @param tournamentRepository  the repository for tournaments.
   * @param inscriptionRepository the repository for registrations.
   */
  public MatchService(MatchRepository matchRepository,
                      TournamentRepository tournamentRepository,
                      InscriptionEquipeTournoiRepository inscriptionRepository) {
    this.matchRepository = matchRepository;
    this.tournamentRepository = tournamentRepository;
    this.inscriptionRepository = inscriptionRepository;
  }

  /**
   * Finds a match by its ID.
   *
   * @param id The ID of the match to find.
   * @return The found match or null.
   */
  public Match updateResult(Long matchId, Integer score1, Integer score2) {
    Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match introuvable."));

  /**
   * Saves or updates a match in the database.
   *
   * @param match The match object to save.
   * @return The saved match entity.
   */
  public Match saveOne(Match match) {
    // Saves the provided match entity into the database and returns the saved object
    return matchRepository.save(match);
  }

  /**
   * Generates a first-round knockout schedule for a tournament.
   * Teams are shuffled randomly before pairings.
   * If the number of teams is odd, one team receives a default BYE victory.
   *
   * @param tournamentId the unique identifier of the tournament.
   * @throws IllegalStateException    if the tournament is not in the right state.
   * @throws IllegalArgumentException if there are fewer than 2 teams.
   */
  public void generateTournamentSchedule(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId)
        .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    if (!"CLOTURE".equals(tournament.getStatus()) && !"EN_COURS".equals(tournament.getStatus())) {
      throw new IllegalStateException(
          "Le planning ne peut être généré que pour un tournoi clôturé ou en cours.");
    }

    List<Match> existingMatches =
        matchRepository.findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
    if (!existingMatches.isEmpty()) {
      throw new IllegalStateException("Le planning a déjà été généré pour ce tournoi.");
    }

    List<RegistrationTeamTournament> registrations =
        inscriptionRepository.findByTournament(tournament);
    List<Team> teams = new ArrayList<>(registrations.stream()
        .map(RegistrationTeamTournament::getTeam)
        .sorted(Comparator.comparing(Team::getId))
        .toList());

    Collections.shuffle(teams);

    if (teams.size() < 2) {
      throw new IllegalArgumentException(
          "Il faut au moins 2 équipes pour générer un planning.");
    }

    LocalDateTime baseDate = tournament.getStartDate().atTime(10, 0);
    LocalDateTime minimumFutureDate = LocalDateTime.now().plusHours(1);
    if (baseDate.isBefore(minimumFutureDate)) {
      baseDate = minimumFutureDate;
    }

    LocalDateTime tournamentEndDate = tournament.getEndDate().atTime(23, 59, 59);
    if (baseDate.isAfter(tournamentEndDate)) {
      throw new IllegalStateException(
          "Le planning ne peut pas être généré dans la fenêtre du tournoi.");
    }

    int n = teams.size();
    int realMatchCount = n / 2;       // floor(n/2) real matches
    boolean hasBye = n % 2 == 1; // one BYE if odd

    if (realMatchCount > 0) {
      LocalDateTime lastMatchDate = baseDate.plusHours((realMatchCount - 1L) * 2L);
      if (lastMatchDate.isAfter(tournamentEndDate)) {
        throw new IllegalStateException(
            "La fenêtre du tournoi est trop courte pour placer tous les matchs.");
      }
    }

    List<Match> matches = new ArrayList<>();

    // 1. Real matches: pair teams[0..2*realMatchCount-1].
    for (int i = 0; i < realMatchCount * 2; i += 2) {
      Match match = new Match();
      match.setTournament(tournament);
      match.setTeam1(teams.get(i));
      match.setTeam2(teams.get(i + 1));
      match.setRoundNumber(1);
      match.setStatus("PENDING");
      match.setWinner(null);
      match.setPoolCode(null);
      match.setMatchDate(baseDate.plusHours(i / 2L * 2L));
      matches.add(match);
    }

    // 2. Single BYE if n is odd: last team advances automatically to finale.
    if (hasBye) {
      Team byeTeam = teams.get(n - 1);
      Match match = new Match();
      match.setTournament(tournament);
      match.setTeam1(byeTeam);
      match.setTeam2(null);
      match.setRoundNumber(1);
      match.setStatus("FINISHED");
      match.setWinner(byeTeam);
      match.setScoreTeam1(1);
      match.setScoreTeam2(0);
      match.setPoolCode("BYE");
      match.setMatchDate(baseDate);
      matches.add(match);
    }

    matchRepository.saveAll(matches);
    tournament.setMatchSchedulePublished(false);
    tournamentRepository.save(tournament);
  }

  /**
   * Publishes the generated schedule so it becomes public.
   *
   * @param tournamentId the unique identifier of the tournament.
   */
  public void publishTournamentSchedule(Long tournamentId) {
    Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new IllegalStateException("Tournoi introuvable."));

    List<Match> matches =
        matchRepository.findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
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
    return matchRepository.findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
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
    return matchRepository.findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
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
}