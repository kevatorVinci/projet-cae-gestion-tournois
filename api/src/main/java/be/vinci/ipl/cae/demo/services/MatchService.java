package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Service handling business logic for Matches and Tournament Schedules.
 */
@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;

    /**
     * Constructor for MatchService.
     *
     * @param matchRepository the match repository
     * @param tournamentRepository the tournament repository
     */
    public MatchService(MatchRepository matchRepository, TournamentRepository tournamentRepository) {
        this.matchRepository = matchRepository;
        this.tournamentRepository = tournamentRepository;
    }

    /**
     * Generates the tournament schedule with two time slots per day (10:00 and 14:00).
     *
     * @param tournamentId the unique identifier of the tournament
     */
    @Transactional
    public void generateTournamentSchedule(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));

        List<Team> registeredTeams = tournament.getRegistrations().stream()
                .map(registration -> registration.getTeam())
                .collect(Collectors.toList());

        if (registeredTeams.size() < 2) {
            throw new IllegalStateException("Not enough teams to start the tournament.");
        }

        Collections.shuffle(registeredTeams);

        LocalDate currentDate = tournament.getStartDate();
        boolean morningSlot = true;
        String roundName = registeredTeams.size() <= 2 ? "Final" : "Round 1";

        for (int i = 0; i < registeredTeams.size(); i += 2) {
            if (i + 1 < registeredTeams.size()) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setTeam1(registeredTeams.get(i));
                match.setTeam2(registeredTeams.get(i + 1));
                match.setStatus("SCHEDULED");

                if (roundName.equals("Final")) {
                    match.setScheduledDate(tournament.getEndDate().atTime(LocalTime.of(15, 0)));
                    match.setRoundName("Final");
                } else {
                    LocalTime matchTime = morningSlot ? LocalTime.of(10, 0) : LocalTime.of(14, 0);
                    match.setScheduledDate(currentDate.atTime(matchTime));
                    match.setRoundName(roundName);

                    if (!morningSlot) {
                        currentDate = currentDate.plusDays(1);
                    }
                    morningSlot = !morningSlot;
                }

                matchRepository.save(match);
            }
        }
    }

    /**
     * Retrieves all matches for a specific tournament.
     *
     * @param tournamentId the unique identifier of the tournament
     * @return a list of matches belonging to the tournament
     */
    public List<Match> getTournamentMatches(Long tournamentId) {
        // We ask the repository to find all matches using the tournament ID
        return matchRepository.findByTournamentId(tournamentId);
    }
}