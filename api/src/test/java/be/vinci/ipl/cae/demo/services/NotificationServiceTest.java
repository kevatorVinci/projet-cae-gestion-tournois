package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock
  private NotificationRepository notificationRepository;

  @InjectMocks
  private NotificationService notificationService;

  private User user;
  private Notification notification;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(1L);
    user.setTag("AliceTag");

    notification = new Notification();
    notification.setIdNotification(100L);
    notification.setUser(user);
    notification.setMessage("Test message");
    notification.setEstLue(false);
  }

  // ═══════════════════════════════════════════════════════════════════
  // getByUser
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void getByUser_retourneListeTrieeParDate() {
    when(notificationRepository.findByUserIdOrderByDateEnvoiDesc(1L))
        .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getByUser(1L);

    assertFalse(result.isEmpty());
    assertEquals(1, result.size());
    verify(notificationRepository).findByUserIdOrderByDateEnvoiDesc(1L);
  }

  @Test
  void getByUser_aucuneNotification_retourneListeVide() {
    when(notificationRepository.findByUserIdOrderByDateEnvoiDesc(1L)).thenReturn(List.of());

    List<Notification> result = notificationService.getByUser(1L);

    assertTrue(result.isEmpty());
  }

  // ═══════════════════════════════════════════════════════════════════
  // getUnread
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void getUnread_retourneSeulementNonLues() {
    when(notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(1L, false))
        .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getUnread(1L);

    assertFalse(result.isEmpty());
    assertFalse(result.get(0).getEstLue());
  }

  @Test
  void getUnread_toutesLues_retourneListeVide() {
    when(notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(1L, false))
        .thenReturn(List.of());

    List<Notification> result = notificationService.getUnread(1L);

    assertTrue(result.isEmpty());
  }

  // ═══════════════════════════════════════════════════════════════════
  // markAsRead
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void markAsRead_notificationPasseALue() {
    when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));
    when(notificationRepository.save(any())).thenReturn(notification);

    Notification result = notificationService.markAsRead(100L);

    assertTrue(result.getEstLue());
    verify(notificationRepository).save(notification);
  }

  @Test
  void markAsRead_notificationInexistante_throwsRuntime() {
    when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> notificationService.markAsRead(999L));
    verify(notificationRepository, never()).save(any());
  }

  // ═══════════════════════════════════════════════════════════════════
  // markAllAsRead
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void markAllAsRead_toutesLesNotifsPassentALues() {
    Notification n2 = new Notification();
    n2.setIdNotification(101L);
    n2.setUser(user);
    n2.setEstLue(false);

    when(notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(1L, false))
        .thenReturn(List.of(notification, n2));

    notificationService.markAllAsRead(1L);

    assertTrue(notification.getEstLue());
    assertTrue(n2.getEstLue());
    verify(notificationRepository).saveAll(List.of(notification, n2));
  }

  @Test
  void markAllAsRead_aucuneNonLue_neFaitRien() {
    when(notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(1L, false))
        .thenReturn(List.of());

    notificationService.markAllAsRead(1L);

    verify(notificationRepository).saveAll(List.of());
  }

  // ═══════════════════════════════════════════════════════════════════
  // deleteByUser
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void deleteByUser_supprimeToutesLesNotifs() {
    notificationService.deleteByUser(1L);

    verify(notificationRepository).deleteByUserId(1L);
  }

  // ═══════════════════════════════════════════════════════════════════
  // createNotification
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void createNotification_sauvegardeAvecBonnesValeurs() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.createNotification(user, "Mon message");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());

    Notification saved = captor.getValue();
    assertEquals(user, saved.getUser());
    assertEquals("Mon message", saved.getMessage());
    assertFalse(saved.getEstLue()); // non lue par défaut
    assertNotNull(saved.getDateEnvoi());
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierCreationCompte
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierCreationCompte_messageCommenceParBienvenue() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierCreationCompte(user);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Bienvenue"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierCreationEquipe
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierCreationEquipe_messageContientNomEquipe() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierCreationEquipe(user, "Les Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("Les Invincibles"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierDemandEnvoyee
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierDemandEnvoyee_messageCommenceParDemande() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierDemandEnvoyee(user, "Les Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Demande envoyée"));
    assertTrue(captor.getValue().getMessage().contains("Les Invincibles"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierNouvelleDemandeResponsable
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierNouvelleDemandeResponsable_messageContientTagCandidat() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierNouvelleDemandeResponsable(user, "BobTag", "Les Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    String msg = captor.getValue().getMessage();
    assertTrue(msg.contains("BobTag"));
    assertTrue(msg.contains("Les Invincibles"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierDemandeAcceptee
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierDemandeAcceptee_messageCommenceParAccepte() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierDemandeAcceptee(user, "Les Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Accepté"));
    assertTrue(captor.getValue().getMessage().contains("Les Invincibles"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // notifierDemandeRefusee
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void notifierDemandeRefusee_messageCommenceParRefus() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierDemandeRefusee(user, "Les Invincibles", "Niveau insuffisant");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    String msg = captor.getValue().getMessage();
    assertTrue(msg.startsWith("Refus"));
    assertTrue(msg.contains("Niveau insuffisant"));
  }

  @Test
  void notifierDemandeRefusee_sansRaison_afficheMsgDefaut() {
    // Règle : si pas de raison → message par défaut affiché
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierDemandeRefusee(user, "Les Invincibles", null);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("Aucune raison précisée"));
  }

  @Test
  void notifierDemandeRefusee_raisonVide_afficheMsgDefaut() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifierDemandeRefusee(user, "Les Invincibles", "   ");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("Aucune raison précisée"));
  }
}
