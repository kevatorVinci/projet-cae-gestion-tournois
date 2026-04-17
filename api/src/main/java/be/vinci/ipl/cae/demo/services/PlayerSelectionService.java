package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
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

    /**
     * Constructor.
     *
     * @param playerSelectionRepository the selection repository
     * @param matchRepository           the match repository
     * @param userRepository            the user repository
     * @param teamRepository            the team repository
     */
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
     *
     * @param matchId  the match id
     * @param memberId the member id
     * @param teamId   the team id
     * @return the created selection
     */
    public PlayerSelection createSelection(Long matchId, Long memberId, Long teamId) {
        Match match = matchRepository.findById(matchId).orElse(null);
        User member = userRepository.findById(memberId).orElse(null);
        Team team = teamRepository.findById(teamId).orElse(null);

        if (match == null || member == null || team == null) {
            return null;
        }

        PlayerSelection selection = new PlayerSelection();
        selection.setMatch(match);
        selection.setMember(member);
        selection.setTeam(team);

        return playerSelectionRepository.save(selection);
    }

    /**
     * Gets all players participating in a specific match.
     *
     * @param matchId the match id
     * @return the selections
     */
    public Iterable<PlayerSelection> getSelectionsForMatch(Long matchId) {
        return playerSelectionRepository.findByMatchId(matchId);
    }
}