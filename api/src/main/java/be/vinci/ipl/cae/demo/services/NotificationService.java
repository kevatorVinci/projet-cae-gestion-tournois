package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;

  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  public List<Notification> getByUser(Long userId) {
    return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
  }

  public List<Notification> getUnread(Long userId) {
    return notificationRepository
            .findByUserIdAndIsReadOrderBySentDateDesc(userId, false);
  }

  public Notification markAsRead(Long notificationId) {
    Notification n = notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));

    n.setIsRead(true);
    return notificationRepository.save(n);
  }

  public void markAllAsRead(Long userId) {
    List<Notification> unread = notificationRepository
            .findByUserIdAndIsReadOrderBySentDateDesc(userId, false);

    unread.forEach(n -> n.setIsRead(true));
    notificationRepository.saveAll(unread);
  }

  public void deleteByUser(Long userId) {
    notificationRepository.deleteByUserId(userId);
  }

  public void delete(Long notificationId) {
    notificationRepository.deleteById(notificationId);
  }

  public Notification createNotification(User user, String message) {
    Notification notification = new Notification();
    notification.setUser(user);
    notification.setMessage(message);
    notification.setIsRead(false);
    return notificationRepository.save(notification);
  }

  public void notifyAccountCreation(User user) {
    createNotification(
            user,
            "Welcome: your account has been created. Join or create a team to start!");
  }

  public void notifyTeamCreation(User user, String teamName) {
    createNotification(
            user, "Team created: you are now the manager of team '" + teamName + "'.");
  }

  public void sendApplicationNotification(User user, String teamName) {
    createNotification(
            user,
            "Application sent: your request to join '" + teamName + "' is pending.");
  }

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

  public void notifyRequestAccepted(User user, String teamName) {
    createNotification(
            user,
            "Accepted: your request to join '" + teamName + "' has been accepted. Welcome!");
  }

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

  public void notifyDraftTournamentCreation(User admin, String tournamentName) {
    createNotification(
            admin,
            "Admin: new draft tournament '" + tournamentName + "'."
                    + " Publish when ready.");
  }

  public void notifyTournamentPublished(User user, String tournamentName) {
    createNotification(
            user,
            "New tournament: '"
                    + tournamentName
                    + "' has just been published. Register now!");
  }
}