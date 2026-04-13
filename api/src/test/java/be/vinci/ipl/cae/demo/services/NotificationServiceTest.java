package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    notification.setId(100L);
    notification.setUser(user);
    notification.setMessage("Test message");
    notification.setIsRead(false);
  }

  @Test
  void getByUser_returnsSortedList() {
    when(notificationRepository.findByUserIdOrderBySentDateDesc(1L))
      .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getByUser(1L);

    assertFalse(result.isEmpty());
    assertEquals(1, result.size());
    verify(notificationRepository).findByUserIdOrderBySentDateDesc(1L);
  }

  @Test
  void getByUser_noNotifications_returnsEmptyList() {
    when(notificationRepository.findByUserIdOrderBySentDateDesc(1L)).thenReturn(List.of());

    List<Notification> result = notificationService.getByUser(1L);

    assertTrue(result.isEmpty());
  }

  @Test
  void getUnread_returnsOnlyUnread() {
    when(notificationRepository.findByUserIdAndIsReadOrderBySentDateDesc(1L, false))
      .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getUnread(1L);

    assertFalse(result.isEmpty());
    assertFalse(result.get(0).getIsRead());
  }

  @Test
  void markAsRead_notificationBecomesRead() {
    when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));
    when(notificationRepository.save(any())).thenReturn(notification);

    Notification result = notificationService.markAsRead(100L);

    assertTrue(result.getIsRead());
    verify(notificationRepository).save(notification);
  }

  @Test
  void markAsRead_nonExistentNotification_throwsRuntime() {
    when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> notificationService.markAsRead(999L));
    verify(notificationRepository, never()).save(any());
  }

  @Test
  void markAllAsRead_allNotificationsBecomeRead() {
    Notification n2 = new Notification();
    n2.setId(101L);
    n2.setUser(user);
    n2.setIsRead(false);

    when(notificationRepository.findByUserIdAndIsReadOrderBySentDateDesc(1L, false))
      .thenReturn(List.of(notification, n2));

    notificationService.markAllAsRead(1L);

    assertTrue(notification.getIsRead());
    assertTrue(n2.getIsRead());
    verify(notificationRepository).saveAll(List.of(notification, n2));
  }

  @Test
  void deleteByUser_removesAllNotifications() {
    notificationService.deleteByUser(1L);
    verify(notificationRepository).deleteByUserId(1L);
  }

  @Test
  void createNotification_savesWithCorrectValues() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.createNotification(user, "My message");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());

    Notification saved = captor.getValue();
    assertEquals(user, saved.getUser());
    assertEquals("My message", saved.getMessage());
    assertFalse(saved.getIsRead());
    assertNotNull(saved.getSentDate());
  }

  @Test
  void notifyAccountCreation_messageStartsWithWelcome() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyAccountCreation(user);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Welcome"));
  }

  @Test
  void notifyTeamCreation_messageContainsTeamName() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyTeamCreation(user, "The Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("The Invincibles"));
  }

  @Test
  void notifyRequestAccepted_messageStartsWithAccepted() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestAccepted(user, "The Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Accepted"));
  }

  @Test
  void notifyRequestDenied_withReason_showsReason() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestDenied(user, "The Invincibles", "Insufficient level");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    String msg = captor.getValue().getMessage();
    assertTrue(msg.startsWith("Denied"));
    assertTrue(msg.contains("Insufficient level"));
  }

  @Test
  void notifyRequestDenied_noReason_showsDefaultMsg() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestDenied(user, "The Invincibles", null);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("No reason provided"));
  }
}