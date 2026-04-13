package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.never;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

  @Nested
  @DisplayName("getAllByTournament()")
  class GetAllByTournament {

    @Test
    void returnsRegistrations() {
      Tournament t = makeTournament(1L, "OUVERT");
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(registrationRepository.findByTournament(t)).thenReturn(List.of(i));

      Iterable<RegistrationTeamTournament> result = service.getAllByTournament(1L);

      assertThat(result).containsExactly(i);
    }

    @Test
    void returnsNullIfTournamentDoesNotExist() {
      when(tournamentRepository.findById(99L)).thenReturn(Optional.empty());

      Iterable<RegistrationTeamTournament> result = service.getAllByTournament(99L);

      assertThat(result).isNull();
    }
  }

  @Nested
  @DisplayName("getAllByTeam()")
  class GetAllByTeam {

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

  @Nested
  @DisplayName("register()")
  class Register {

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

    @Test
    void errorIfLessThanFourMembers() {
      Tournament t = makeTournament(1L, "OUVERT");
      Team e = makeTeamWithMemberCount(1L, 3);
      when(tournamentRepository.findById(1L)).thenReturn(Optional.of(t));
      when(teamRepository.findById(1L)).thenReturn(Optional.of(e));

      org.junit.jupiter.api.Assertions.assertThrows(
              IllegalArgumentException.class,
              () -> service.register(1L, 1L)
      );
    }

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

  @Nested
  @DisplayName("unregister()")
  class Unregister {

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