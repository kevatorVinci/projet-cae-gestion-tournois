package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service handling business logic for match results.
 */
@Service
public class MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    /**
     * Constructor.
     *
     * @param matchResultRepository the result repository
     * @param matchRepository       the match repository
     * @param userRepository        the user repository
     */
    public MatchResultService(
            MatchResultRepository matchResultRepository,
            MatchRepository matchRepository,
            UserRepository userRepository) {
        this.matchResultRepository = matchResultRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
    }

    /**
     * Encodes a new result for a specific match.
     *
     * @param matchId the match id
     * @param dto     the data transfer object
     * @return the saved result
     */
    @Transactional
    public MatchResult encodeResult(Long matchId, MatchResultCreateDto dto) {
        Match match = matchRepository.findById(matchId).orElse(null);
        User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

        if (match == null || admin == null) {
            return null;
        }

        MatchResult result = new MatchResult();
        result.setMatch(match);
        result.setAdminEncoder(admin);
        result.setScoreTeam1(dto.getScoreTeam1());
        result.setScoreTeam2(dto.getScoreTeam2());
        result.setForfeitTeam1(dto.isForfeitTeam1());
        result.setForfeitTeam2(dto.isForfeitTeam2());
        result.setEncodingDate(LocalDateTime.now());
        result.setValidationStatusTeam1("PENDING");
        result.setValidationStatusTeam2("PENDING");

        match.setStatus("FINISHED");
        matchRepository.save(match);

        return matchResultRepository.save(result);
    }

    /**
     * Finds a result for a specific match.
     *
     * @param matchId the match id
     * @return the match result
     */
    public MatchResult getResultForMatch(Long matchId) {
        return matchResultRepository.findById(matchId).orElse(null);
    }
}