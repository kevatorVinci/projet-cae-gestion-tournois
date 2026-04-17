package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for MatchService.
 */
@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

  @Mock
  private MatchRepository matchRepository;

  @Mock
  private TournamentRepository tournamentRepository;

  @Mock
  private InscriptionEquipeTournoiRepository inscriptionRepository;

  @InjectMocks
  private MatchService service;

  private Tournament makeTournament(Long id, LocalDate startDate, LocalDate endDate) {
    Tournament tournament = new Tournament();
    tournament.setId(id);
    tournament.setName("Tournament " + id);
    tournament.setStartDate(startDate);
    tournament.setEndDate(endDate);
    tournament.setRegistrationDeadline(startDate.minusDays(3));
    tournament.setStatus("CLOTURE");
    tournament.setMaxParticipants(8);
    return tournament;
  }

  private Team makeTeam(Long id, String name) {
    Team team = new Team();
    team.setId(id);
    team.setName(name);
    return team;
  }

  private RegistrationTeamTournament makeRegistration(Tournament tournament, Team team) {
    RegistrationTeamTournament registration = new RegistrationTeamTournament();
    registration.setTournament(tournament);
    registration.setTeam(team);
    return registration;
  }

  @Test
  void generateTournamentScheduleUsesFutureDatesWithinTournamentWindow() {
    Tournament tournament = makeTournament(
        1L,
        LocalDate.now().minusDays(1),
        LocalDate.now().plusDays(2));

    Team alpha = makeTeam(1L, "Alpha");
    Team beta = makeTeam(2L, "Beta");
    Team gamma = makeTeam(3L, "Gamma");

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(inscriptionRepository.findByTournament(tournament)).thenReturn(
        List.of(
            makeRegistration(tournament, alpha),
            makeRegistration(tournament, beta),
            makeRegistration(tournament, gamma)));
    when(matchRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(tournamentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    LocalDateTime beforeGeneration = LocalDateTime.now();

    service.generateTournamentSchedule(1L);

    ArgumentCaptor<Iterable<Match>> matchesCaptor = ArgumentCaptor.forClass(Iterable.class);
    org.mockito.Mockito.verify(matchRepository).saveAll(matchesCaptor.capture());

    List<Match> matches = StreamSupport.stream(matchesCaptor.getValue().spliterator(), false)
        .toList();
    LocalDateTime endBoundary = tournament.getEndDate().atTime(23, 59, 59);

    assertThat(matches).hasSize(2);
    assertThat(matches)
        .allSatisfy(match -> {
          assertThat(match.getMatchDate()).isAfter(beforeGeneration);
          assertThat(match.getMatchDate()).isBeforeOrEqualTo(endBoundary);
        });

    Match byeMatch = matches.stream()
        .filter(match -> match.getTeam2() == null)
        .findFirst()
        .orElseThrow();
    assertThat(byeMatch.getStatus()).isEqualTo("FINISHED");
    assertThat(byeMatch.getWinner()).isEqualTo(byeMatch.getTeam1());
    assertThat(byeMatch.getPoolCode()).isEqualTo("BYE");
  }

  @Test
  void generateTournamentScheduleFailsWhenWindowIsAlreadyOver() {
    Tournament tournament = makeTournament(
        1L,
        LocalDate.now().minusDays(4),
        LocalDate.now().minusDays(1));

    Team alpha = makeTeam(1L, "Alpha");
    Team beta = makeTeam(2L, "Beta");

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(inscriptionRepository.findByTournament(tournament)).thenReturn(
        List.of(
            makeRegistration(tournament, alpha),
            makeRegistration(tournament, beta)));

    assertThrows(IllegalStateException.class, () -> service.generateTournamentSchedule(1L));
  }
}