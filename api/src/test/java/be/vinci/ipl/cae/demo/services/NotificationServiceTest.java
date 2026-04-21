package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService using Mockito.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock
  private NotificationRepository notificationRepository;

  @InjectMocks
  private NotificationService notificationService;

  private User user;
  private Notification notification;

  /**
   * Set up mock data before each test.
   */
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

  /**
   * Tests retrieving notifications for a user.
   */
  @Test
  void getByUserReturnsSortedList() {
    when(notificationRepository.findByUserIdOrderBySentDateDesc(1L))
        .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getByUser(1L);

    assertFalse(result.isEmpty());
    assertEquals(1, result.size());
    verify(notificationRepository).findByUserIdOrderBySentDateDesc(1L);
  }

  /**
   * Tests retrieving notifications when the user has none.
   */
  @Test
  void getByUserNoNotificationsReturnsEmptyList() {
    when(notificationRepository.findByUserIdOrderBySentDateDesc(1L)).thenReturn(List.of());

    List<Notification> result = notificationService.getByUser(1L);

    assertTrue(result.isEmpty());
  }

  /**
   * Tests retrieving only unread notifications.
   */
  @Test
  void getUnreadReturnsOnlyUnread() {
    when(notificationRepository.findByUserIdAndIsReadOrderBySentDateDesc(1L, false))
        .thenReturn(List.of(notification));

    List<Notification> result = notificationService.getUnread(1L);

    assertFalse(result.isEmpty());
    assertFalse(result.get(0).getIsRead());
  }

  /**
   * Tests marking a specific notification as read.
   */
  @Test
  void markAsReadNotificationBecomesRead() {
    when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));
    when(notificationRepository.save(any())).thenReturn(notification);

    Notification result = notificationService.markAsRead(100L);

    assertTrue(result.getIsRead());
    verify(notificationRepository).save(notification);
  }

  /**
   * Tests marking a non-existent notification as read.
   */
  @Test
  void markAsReadNonExistentNotificationThrowsRuntime() {
    when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> notificationService.markAsRead(999L));
    verify(notificationRepository, never()).save(any());
  }

  /**
   * Tests marking all notifications as read for a user.
   */
  @Test
  void markAllAsReadAllNotificationsBecomeRead() {
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

  /**
   * Tests deleting all notifications for a user.
   */
  @Test
  void deleteByUserRemovesAllNotifications() {
    notificationService.deleteByUser(1L);
    verify(notificationRepository).deleteByUserId(1L);
  }

  /**
   * Tests creating a notification with correct field values.
   */
  @Test
  void createNotificationSavesWithCorrectValues() {
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

  /**
   * Tests the account creation notification message.
   */
  @Test
  void notifyAccountCreationMessageStartsWithWelcome() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyAccountCreation(user);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Bienvenue"));
  }

  /**
   * Tests the team creation notification message.
   */
  @Test
  void notifyTeamCreationMessageContainsTeamName() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyTeamCreation(user, "The Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("The Invincibles"));
  }

  /**
   * Tests the request accepted notification message.
   */
  @Test
  void notifyRequestAcceptedMessageStartsWithAccepted() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestAccepted(user, "The Invincibles");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().startsWith("Accepté :"));
  }

  /**
   * Tests the request denied notification message with a reason.
   */
  @Test
  void notifyRequestDeniedWithReasonShowsReason() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestDenied(user, "The Invincibles", "Insufficient level");

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    String msg = captor.getValue().getMessage();
    assertTrue(msg.startsWith("Refusé :"));
    assertTrue(msg.contains("Insufficient level"));
  }

  /**
   * Tests the request denied notification message without a specific reason.
   */
  @Test
  void notifyRequestDeniedNoReasonShowsDefaultMsg() {
    when(notificationRepository.save(any())).thenReturn(notification);

    notificationService.notifyRequestDenied(user, "The Invincibles", null);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());
    assertTrue(captor.getValue().getMessage().contains("Aucune raison fournie"));
  }

  /**
   * Tests the match selection notification message.
   */
  @Test
  void notifySelectedForMatchMessageContainsContext() {
    when(notificationRepository.save(any())).thenReturn(notification);

    Team selectedTeam = new Team();
    selectedTeam.setId(10L);
    selectedTeam.setName("Team Alpha");

    Team opponent = new Team();
    opponent.setId(11L);
    opponent.setName("Team Omega");

    Tournament tournament = new Tournament();
    tournament.setName("Spring Cup");

    Match match = new Match();
    match.setTeam1(selectedTeam);
    match.setTeam2(opponent);
    match.setTournament(tournament);
    match.setScheduledDateTime(LocalDateTime.of(2026, 6, 1, 20, 0));

    notificationService.notifySelectedForMatch(user, match, selectedTeam);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(captor.capture());

    String message = captor.getValue().getMessage();
    assertTrue(message.startsWith("Composition confirmée"));
    assertTrue(message.contains("Team Alpha"));
    assertTrue(message.contains("Team Omega"));
    assertTrue(message.contains("Spring Cup"));
    assertTrue(message.contains("01/06/2026 à 20:00"));
  }
}