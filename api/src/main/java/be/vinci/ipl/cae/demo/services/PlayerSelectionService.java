package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User; // Or whatever your member entity is named
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.PlayerSelectionRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;

/**
 * Service handling business logic for player selections.
 */
@Service
public class PlayerSelectionService {

    private final PlayerSelectionRepository playerSelectionRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    public PlayerSelectionService(
            PlayerSelectionRepository playerSelectionRepository,
            MatchRepository matchRepository,
            UserRepository userRepository,
            TeamRepository teamRepository) {
        this.playerSelectionRepository = playerSelectionRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
    }

    /**
     * Creates a new player selection for a match.
     */
    public PlayerSelection createSelection(Long matchId, Long memberId, Long teamId) {
        // 1. We find the real objects in the database
        Match match = matchRepository.findById(matchId).orElse(null);
        User member = userRepository.findById(memberId).orElse(null);
        Team team = teamRepository.findById(teamId).orElse(null);

        // 2. If any of them doesn't exist, we stop and return null
        if (match == null || member == null || team == null) {
            return null;
        }

        // 3. We create the link between them
        PlayerSelection selection = new PlayerSelection();
        selection.setMatch(match);
        selection.setMember(member);
        selection.setTeam(team);

        // 4. We save it to the database
        return playerSelectionRepository.save(selection);
    }

    /**
     * Gets all players participating in a specific match.
     */
    public Iterable<PlayerSelection> getSelectionsForMatch(Long matchId) {
        return playerSelectionRepository.findByMatchId(matchId);
    }
}