package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

  @Mock
  private TournamentRepository tournamentRepository;

  @Mock
  private RegisterTeamTournamentService registrationService;

  @Mock
  private NotificationService notificationService;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private TournamentService service;

  private Tournament makeTournament(String name) {
    Tournament tournament = new Tournament();
    tournament.setName(name);
    return tournament;
  }

  private User makeUser(long id, String tag) {
    User user = new User();
    user.setId(id);
    user.setTag(tag);
    user.setAdmin(false);
    return user;
  }

  private User makeAdmin(long id, String tag) {
    User user = new User();
    user.setId(id);
    user.setTag(tag);
    user.setAdmin(true);
    return user;
  }

  @Test
  void create_notifiesOnlyAdmins() {
    Tournament tournament = makeTournament("Spring Cup 2026");
    User alice = makeAdmin(1L, "Alice");
    User bob = makeUser(2L, "Bob");
    User charlie = makeAdmin(3L, "Charlie");

    when(tournamentRepository.findByName("Spring Cup 2026")).thenReturn(Optional.empty());
    when(tournamentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(userRepository.findAll()).thenReturn(List.of(alice, bob, charlie));

    Tournament result = service.create(tournament);

    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo("BROUILLON");
    // Only the 2 admins receive the notification
    verify(notificationService, times(2)).notifyDraftTournamentCreation(any(User.class), any());
  }

  @Test
  void create_doesNotNotifyIfNameAlreadyUsed() {
    Tournament tournament = makeTournament("Spring Cup 2026");
    when(tournamentRepository.findByName("Spring Cup 2026"))
      .thenReturn(Optional.of(makeTournament("Spring Cup 2026")));

    Tournament result = service.create(tournament);

    assertThat(result).isNull();
    verify(tournamentRepository, never()).save(any());
    verify(notificationService, never()).notifyDraftTournamentCreation(any(User.class), any());
  }

  @Test
  void publish_notifiesAllUsers() {
    Tournament tournament = makeTournament("Spring Cup 2026");
    tournament.setId(1L);
    tournament.setStatus("BROUILLON");

    User alice = makeAdmin(1L, "Alice");
    User bob = makeUser(2L, "Bob");
    User charlie = makeUser(3L, "Charlie");

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(tournamentRepository.save(any())).thenAnswer(invocation -> {
      Tournament t = invocation.getArgument(0);
      // 🇬🇧 Utilisation de OPEN au lieu de OUVERT
      assertThat(t.getStatus()).isEqualTo("OUVERT");
      return t;
    });
    when(userRepository.findAll()).thenReturn(List.of(alice, bob, charlie));

    Tournament result = service.publish(1L);

    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo("OUVERT");
    // All 3 users receive the notification
    verify(notificationService, times(3)).notifyTournamentPublished(any(User.class), any());
  }
}