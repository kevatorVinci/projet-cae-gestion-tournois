package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.match.MatchResultCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MatchResult;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MatchResultRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling business logic for match results.
 */
@Service
public class MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    public MatchResultService(MatchResultRepository matchResultRepository,
                              MatchRepository matchRepository,
                              UserRepository userRepository) {
        this.matchResultRepository = matchResultRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
    }

    /**
     * Encodes a new result for a specific match.
     * Uses @Transactional because we update both the MatchResult and the Match table.
     */
    @Transactional
    public MatchResult encodeResult(Long matchId, MatchResultCreateDto dto) {
        // 1. Find the match and the admin
        Match match = matchRepository.findById(matchId).orElse(null);
        User admin = userRepository.findById(dto.getAdminEncoderId()).orElse(null);

        // 2. If match or admin is not found, stop here
        if (match == null || admin == null) {
            return null;
        }

        // 3. Create the new result
        MatchResult result = new MatchResult();
        result.setMatch(match);
        result.setAdminEncoder(admin);
        result.setScoreTeam1(dto.getScoreTeam1());
        result.setScoreTeam2(dto.getScoreTeam2());
        result.setForfeitTeam1(dto.isForfeitTeam1());
        result.setForfeitTeam2(dto.isForfeitTeam2());

        // Automatically set the encoding date to right now!
        result.setEncodingDate(LocalDateTime.now());

        // Default validation statuses
        result.setValidationStatusTeam1("PENDING");
        result.setValidationStatusTeam2("PENDING");

        // 4. Update the match status to FINISHED
        match.setStatus("FINISHED");
        matchRepository.save(match); // Save the match update

        // 5. Save and return the result
        return matchResultRepository.save(result);
    }

    /**
     * Finds a result for a specific match.
     */
    public MatchResult getResultForMatch(Long matchId) {
        return matchResultRepository.findById(matchId).orElse(null);
    }
}