package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service layer for notification retrieval, creation and state updates.
 */
@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;

  /**
   * Builds the notification service.
   *
   * @param notificationRepository notification repository
   */
  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  /**
   * Gets all notifications for a user.
   *
   * @param userId user id
   * @return notifications ordered by newest first
   */
  public List<Notification> getByUser(Long userId) {
    // We use the English method name here (sentDate instead of dateEnvoi)
    return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
  }

  /**
   * Gets unread notifications for a user.
   *
   * @param userId user id
   * @return unread notifications
   */
  public List<Notification> getUnread(Long userId) {
    // We use the English method name here (isRead instead of estLue)
    return notificationRepository
            .findByUserIdAndIsReadOrderBySentDateDesc(userId, false);
  }

  // ─── Marking ────────────────────────────────────────────────────────────────

  /**
   * Marks one notification as read.
   *
   * @param notificationId notification id
   * @return updated notification
   */
  public Notification markAsRead(Long notificationId) {
    Notification n = notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found")); // Translated error

    // Changing status to read
    n.setRead(true);
    return notificationRepository.save(n);
  }

  /**
   * Marks all notifications of a user as read.
   *
   * @param userId user id
   */
  public void markAllAsRead(Long userId) {
    List<Notification> unread = notificationRepository
            .findByUserIdAndIsReadOrderBySentDateDesc(userId, false);

    // Mark every notification in the list as read
    unread.forEach(n -> n.setRead(true));
    notificationRepository.saveAll(unread);
  }

  // ─── Deletion ─────────────────────────────────────────────────────────────

  /**
   * Deletes all notifications of a user.
   *
   * @param userId user id
   */
  public void deleteByUser(Long userId) {
    notificationRepository.deleteByUserId(userId);
  }

  /**
   * Deletes one notification by id.
   *
   * @param notificationId notification id
   */
  public void delete(Long notificationId) {
    notificationRepository.deleteById(notificationId);
  }

  // ─── Creation (Base method) ───────────────────────────────────────────────

  /**
   * Creates one notification message.
   *
   * @param user    recipient
   * @param message notification text
   * @return persisted notification
   */
  public Notification createNotification(User user, String message) {
    Notification notification = new Notification();
    notification.setUser(user);
    notification.setMessage(message);
    notification.setRead(false);
    return notificationRepository.save(notification);
  }

  // ─── Business Notifications (Prefixes for React frontend) ─────────────────────

  /**
   * Sent to the member when they create their account.
   */
  public void notifyAccountCreation(User user) {
    createNotification(
            user,
            "Welcome: your account has been created. Join or create a team to start!");
  }

  /**
   * Sent to the member when they create a team.
   */
  public void notifyTeamCreation(User user, String teamName) {
    createNotification(
            user, "Team created: you are now the manager of team '" + teamName + "'.");
  }

  /**
   * Sent to the member when their application is sent.
   */
  public void sendApplicationNotification(User user, String teamName) {
    createNotification(
            user,
            "Application sent: your request to join '" + teamName + "' is pending.");
  }

  /**
   * Sent to the primary manager when a new application is received.
   */
  public void notifyNewRequestToManager(
          User manager, String candidateTag, String teamName) {
    createNotification(
            manager,
            "New request: "
                    + candidateTag
                    + " wants to join the team '"
                    + teamName
                    + "'.");
  }

  /**
   * Sent to the member when their application is accepted.
   */
  public void notifyRequestAccepted(User user, String teamName) {
    createNotification(
            user,
            "Accepted: your request to join '" + teamName + "' has been accepted. Welcome!");
  }

  /**
   * Sent to the member when their application is denied.
   */
  public void notifyRequestDenied(User user, String teamName, String reason) {
    String displayedReason =
            (reason == null || reason.isBlank()) ? "No reason provided." : reason;
    createNotification(
            user,
            "Denied: your request to join '"
                    + teamName
                    + "' has been denied. Reason: "
                    + displayedReason);
  }

  /**
   * Sent to admins when a tournament is created in draft state.
   */
  public void notifyDraftTournamentCreation(User admin, String tournamentName) {
    createNotification(
            admin,
            "Admin: new draft tournament '" + tournamentName + "'."
                    + " Publish when ready.");
  }

  /**
   * Sent to all players when a tournament is published.
   */
  public void notifyTournamentPublished(User user, String tournamentName) {
    createNotification(
            user,
            "New tournament: '"
                    + tournamentName
                    + "' has just been published. Register now!");
  }
}
