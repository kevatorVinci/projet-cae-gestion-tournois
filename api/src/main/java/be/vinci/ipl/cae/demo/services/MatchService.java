package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import org.springframework.stereotype.Service;

/**
 * Service class handling the business logic for matches.
 */
@Service
public class MatchService {

  private final MatchRepository matchRepository;

  /**
   * Constructor.
   *
   * @param matchRepository the repository
   */
  public MatchService(MatchRepository matchRepository) {
    this.matchRepository = matchRepository;
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
}