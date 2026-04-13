package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for RegistrationTeamTournamentService using Mockito.
 */
@ExtendWith(MockitoExtension.class)
class RegistrationTeamTournamentServiceTest {

  @Mock
  private InscriptionEquipeTournoiRepository registrationRepository;
  @Mock
  private TournamentRepository tournamentRepository;
  @Mock
  private TeamRepository teamRepository;
  @Mock
  private TournamentService tournamentService;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private RegisterTeamTournamentService service;

  private Tournament makeTournament(Long id, String status) {
    Tournament t = new Tournament();
    t.setId(id);
    t.setName("Tournament " + id);
    t.setStatus(status);
    return t;
  }

  private Team makeTeam(Long id) {
    return makeTeamWithMemberCount(id, 4);
  }

  private Team makeTeamWithMemberCount(Long id, int memberCount) {
    Team e = new Team();
    e.setId(id);
    e.setName("Team " + id);
    for (int i = 0; i < memberCount; i++) {
      User u = new User();
      u.setId((id * 10) + i + 1);
      u.setTag("user" + i);
      u.setTeam(e);
      e.getMembers().add(u);
    }
    return e;
  }

  private RegistrationTeamTournament makeRegistration(Tournament tournament, Team team) {
    RegistrationTeamTournament i = new RegistrationTeamTournament();
    i.setTournament(tournament);
    i.setTeam(team);
    i.setRegistrationDate(LocalDate.now());
    return i;
  }

  /**
   * Tests for the getAllByTournament method.
   */
  @Nested
  @DisplayName("getAllByTournament()")
  class GetAllByTournament {

    /**
     * Tests that registrations are correctly returned.
     */
    @Test
    void returnsRegistrations() {
      Tournament t = makeTournament(1L, "OUVERT");
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(registrationRepository.findByTournament(t)).thenReturn(List.of(i));

      Iterable<RegistrationTeamTournament> result = service.getAllByTournament(1L);

      assertThat(result).containsExactly(i);
    }

    /**
     * Tests that null is returned if the tournament does not exist.
     */
    @Test
    void returnsNullIfTournamentDoesNotExist() {
      when(tournamentRepository.findById(99L)).thenReturn(Optional.empty());

      Iterable<RegistrationTeamTournament> result = service.getAllByTournament(99L);

      assertThat(result).isNull();
    }
  }

  /**
   * Tests for the getAllByTeam method.
   */
  @Nested
  @DisplayName("getAllByTeam()")
  class GetAllByTeam {

    /**
     * Tests that registrations are correctly returned for a team.
     */
    @Test
    void returnsRegistrations() {
      Team e = makeTeam(1L);
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(teamRepository.findById(1L)).thenReturn(Optional.of(e));
      when(registrationRepository.findByTeam(e)).thenReturn(List.of(i));

      Iterable<RegistrationTeamTournament> result = service.getAllByTeam(1L);

      assertThat(result).containsExactly(i);
    }
  }

  /**
   * Tests for the register method.
   */
  @Nested
  @DisplayName("register()")
  class Register {

    /**
     * Tests a successful registration.
     */
    @Test
    void registersWithSuccess() {
      Tournament t = makeTournament(1L, "OUVERT");
      Team e = makeTeam(1L);
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(teamRepository.findById(1L)).thenReturn(Optional.of(e));
      when(registrationRepository.findByTournamentAndTeam(t, e)).thenReturn(Optional.empty());
      when(registrationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      RegistrationTeamTournament result = service.register(1L, 1L);

      assertThat(result).isNotNull();
      assertThat(result.getTournament()).isEqualTo(t);
      assertThat(result.getTeam()).isEqualTo(e);
      verify(notificationService, times(4)).createNotification(any(User.class), anyString());
    }

    /**
     * Tests that registration fails if team has less than 4 members.
     */
    @Test
    void errorIfLessThanFourMembers() {
      Tournament t = makeTournament(1L, "OUVERT");
      Team e = makeTeamWithMemberCount(1L, 3);
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(teamRepository.findById(1L)).thenReturn(Optional.of(e));

      assertThrows(
          IllegalArgumentException.class,
          () -> service.register(1L, 1L)
      );
    }

    /**
     * Tests that registrations are closed when max participants are reached.
     */
    @Test
    void autoClosesIfMaxReached() {
      Tournament t = makeTournament(1L, "OUVERT");
      t.setMaxParticipants(2);
      Team e = makeTeam(1L);
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(teamRepository.findById(1L)).thenReturn(Optional.of(e));
      when(registrationRepository.findByTournamentAndTeam(t, e)).thenReturn(Optional.empty());
      when(registrationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
      when(registrationRepository.findByTournament(t)).thenReturn(
          List.of(new RegistrationTeamTournament(), new RegistrationTeamTournament())
      );

      service.register(1L, 1L);

      verify(tournamentService).closeRegistrations(1L);
    }
  }

  /**
   * Tests for the unregister method.
   */
  @Nested
  @DisplayName("unregister()")
  class Unregister {

    /**
     * Tests successful unregistration.
     */
    @Test
    void unregistersWithSuccess() {
      Tournament t = makeTournament(1L, "OUVERT");
      t.setRegistrationDeadline(LocalDate.now().plusDays(5));
      Team e = makeTeam(1L);
      RegistrationTeamTournament i = makeRegistration(t, e);
      when(registrationRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isTrue();
      verify(registrationRepository).delete(i);
    }

    /**
     * Tests that unregistration fails if the deadline has passed.
     */
    @Test
    void returnsFalseIfDeadlinePassed() {
      Tournament t = makeTournament(1L, "OUVERT");
      t.setRegistrationDeadline(LocalDate.now().minusDays(1));
      RegistrationTeamTournament i = makeRegistration(t, makeTeam(1L));
      when(registrationRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isFalse();
    }
  }
}