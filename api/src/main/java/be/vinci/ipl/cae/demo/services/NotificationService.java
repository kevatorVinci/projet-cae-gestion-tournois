package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service managing all business logic related to user notifications.
 */
@Service
public class NotificationService {

  /**
   * Repository used to access and persist notifications.
   */
  private final NotificationRepository notificationRepository;

  /**
   * Constructor for dependency injection.
   *
   * @param notificationRepository the repository to manage notifications in DB.
   */
  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Retrieves all notifications for a specific user, sorted by date.
   *
   * @param userId the unique identifier of the user.
   * @return a list of notifications for the user.
   */
  public List<Notification> getByUser(Long userId) {
    return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
  }

  /**
   * Retrieves only unread notifications for a specific user.
   *
   * @param userId the unique identifier of the user.
   * @return a list of unread notifications.
   */
  public List<Notification> getUnread(Long userId) {
    return notificationRepository.findByUserIdAndIsReadOrderBySentDateDesc(userId, false);
  }

  /**
   * Marks a specific notification as read.
   *
   * @param notificationId the unique identifier of the notification.
   * @return the updated notification entity.
   */
  public Notification markAsRead(Long notificationId) {
    Notification n = notificationRepository
        .findById(notificationId)
        .orElseThrow(() -> new RuntimeException("Notification not found"));

    n.setIsRead(true);
    return notificationRepository.save(n);
  }

  /**
   * Marks all unread notifications of a user as read.
   *
   * @param userId the unique identifier of the user.
   */
  public void markAllAsRead(Long userId) {
    List<Notification> unread = notificationRepository
        .findByUserIdAndIsReadOrderBySentDateDesc(userId, false);

    unread.forEach(n -> n.setIsRead(true));
    notificationRepository.saveAll(unread);
  }

  /**
   * Deletes all notifications associated with a user.
   *
   * @param userId the unique identifier of the user.
   */
  public void deleteByUser(Long userId) {
    notificationRepository.deleteByUserId(userId);
  }

  /**
   * Deletes a single notification by its ID.
   *
   * @param notificationId the unique identifier of the notification.
   */
  public void delete(Long notificationId) {
    notificationRepository.deleteById(notificationId);
  }

  /**
   * Core method to create and save a new notification.
   *
   * @param user    the user receiving the notification.
   * @param message the text content of the notification.
   * @return the saved notification entity.
   */
  public Notification createNotification(User user, String message) {
    Notification notification = new Notification();
    notification.setUser(user);
    notification.setMessage(message);
    notification.setIsRead(false);
    return notificationRepository.save(notification);
  }

  /**
   * Sends a welcome notification upon account creation.
   *
   * @param user the new user.
   */
  public void notifyAccountCreation(User user) {
    createNotification(
        user,
        "Welcome: your account has been created. Join or create a team to start!"
    );
  }

  /**
   * Notifies the user that their team has been successfully created.
   *
   * @param user     the user who created the team.
   * @param teamName the name of the new team.
   */
  public void notifyTeamCreation(User user, String teamName) {
    createNotification(
        user,
        "Team created: you are now the manager of team '" + teamName + "'."
    );
  }

  /**
   * Notifies the user that their join request has been sent.
   *
   * @param user     the user applying.
   * @param teamName the name of the target team.
   */
  public void sendApplicationNotification(User user, String teamName) {
    createNotification(
        user,
        "Application sent: your request to join '" + teamName + "' is pending."
    );
  }

  /**
   * Notifies a team manager about a new application.
   *
   * @param manager      the team manager.
   * @param candidateTag the nickname/tag of the applicant.
   * @param teamName     the name of the team.
   */
  public void notifyNewRequestToManager(
      User manager,
      String candidateTag,
      String teamName) {
    createNotification(
        manager,
        "New request: " + candidateTag + " wants to join the team '" + teamName + "'."
    );
  }

  /**
   * Notifies the user that their application was accepted.
   *
   * @param user     the applicant.
   * @param teamName the team they joined.
   */
  public void notifyRequestAccepted(User user, String teamName) {
    createNotification(
        user,
        "Accepted: your request to join '" + teamName + "' has been accepted. Welcome!"
    );
  }

  /**
   * Notifies the user that their application was denied with a reason.
   *
   * @param user     the applicant.
   * @param teamName the team they tried to join.
   * @param reason   the explanation for denial.
   */
  public void notifyRequestDenied(User user, String teamName, String reason) {
    String displayedReason =
        (reason == null || reason.isBlank()) ? "No reason provided." : reason;

    createNotification(
        user,
        "Denied: your request to join '" + teamName + "' has been denied. Reason: "
            + displayedReason
    );
  }

  /**
   * Notifies admins that a draft tournament has been created.
   *
   * @param admin          the administrator.
   * @param tournamentName the name of the draft tournament.
   */
  public void notifyDraftTournamentCreation(User admin, String tournamentName) {
    createNotification(
        admin,
        "Admin: new draft tournament '" + tournamentName + "'. Publish when ready."
    );
  }

  /**
   * Notifies users that a tournament is now open for registration.
   *
   * @param user           the user to notify.
   * @param tournamentName the name of the published tournament.
   */
  public void notifyTournamentPublished(User user, String tournamentName) {
    createNotification(
        user,
        "New tournament: '" + tournamentName + "' has just been published. Register now!"
    );
  }
}