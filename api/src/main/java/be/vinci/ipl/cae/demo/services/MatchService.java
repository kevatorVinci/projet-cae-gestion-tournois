package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
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
  public MatchService(
      MatchRepository matchRepository,
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
        .findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);

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
        .findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
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
        .findByTournamentIdOrderByRoundNumberAscMatchDateAscIdAsc(tournamentId);
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