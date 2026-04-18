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
    // Assigns the injected repository to our private variable
    this.matchRepository = matchRepository;
  }

  /**
   * Finds a match by its ID.
   *
   * @param id The ID of the match to find.
   * @return The found match or null.
   */
  public Match getOne(Long id) {
    // Uses the repository to find the match by ID. If not found, it returns null.
    return matchRepository.findById(id).orElse(null);
  }

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
}