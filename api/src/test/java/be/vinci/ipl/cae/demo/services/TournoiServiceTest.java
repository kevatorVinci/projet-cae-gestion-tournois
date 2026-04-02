package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TournoiServiceTest {

  @Mock
  private TournoiRepository tournoiRepository;

  @Mock
  private InscriptionEquipeTournoiService inscriptionService;

  @Mock
  private NotificationService notificationService;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private TournoiService service;

  private Tournoi makeTournoi(String nom) {
    Tournoi tournoi = new Tournoi();
    tournoi.setNom(nom);
    return tournoi;
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
  void create_notifieSeulemmentLesAdmins() {
    Tournoi tournoi = makeTournoi("Spring Cup 2026");
    User alice = makeAdmin(1L, "Alice");
    User bob = makeUser(2L, "Bob");
    User charlie = makeAdmin(3L, "Charlie");

    when(tournoiRepository.findByNom("Spring Cup 2026")).thenReturn(Optional.empty());
    when(tournoiRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(userRepository.findAll()).thenReturn(List.of(alice, bob, charlie));

    Tournoi result = service.create(tournoi);

    assertThat(result).isNotNull();
    assertThat(result.getEtat()).isEqualTo("BROUILLON");
    // Seulement les 2 admins reçoivent la notif, pas Bob
    verify(notificationService, times(2)).notifierCreationTournoiBrouillon(any(User.class), any());
  }

  @Test
  void create_neNotifiePasSiNomDejaUtilise() {
    Tournoi tournoi = makeTournoi("Spring Cup 2026");
    when(tournoiRepository.findByNom("Spring Cup 2026")).thenReturn(Optional.of(makeTournoi("Spring Cup 2026")));

    Tournoi result = service.create(tournoi);

    assertThat(result).isNull();
    verify(tournoiRepository, never()).save(any());
    verify(notificationService, never()).notifierCreationTournoiBrouillon(any(User.class), any());
  }

  @Test
  void publish_notifieTousLesUtilisateurs() {
    Tournoi tournoi = makeTournoi("Spring Cup 2026");
    tournoi.setId(1L);
    tournoi.setEtat("BROUILLON");

    User alice = makeAdmin(1L, "Alice");
    User bob = makeUser(2L, "Bob");
    User charlie = makeUser(3L, "Charlie");

    when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
    when(tournoiRepository.save(any())).thenAnswer(invocation -> {
      Tournoi t = invocation.getArgument(0);
      assertThat(t.getEtat()).isEqualTo("OUVERT");
      return t;
    });
    when(userRepository.findAll()).thenReturn(List.of(alice, bob, charlie));

    Tournoi result = service.publish(1L);

    assertThat(result).isNotNull();
    assertThat(result.getEtat()).isEqualTo("OUVERT");
    // Les 3 utilisateurs reçoivent la notif (admins inclus)
    verify(notificationService, times(3)).notifierPublicationTournoi(any(User.class), any());
  }
}
