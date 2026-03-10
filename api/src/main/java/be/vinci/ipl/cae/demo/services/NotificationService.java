package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service handling notification business logic.
 */
@Service
public class NotificationService {

  @Autowired
  private NotificationRepository notificationRepository;

  /**
   * Retrieves all notifications for a given member.
   *
   * @param idMembre the ID of the member
   * @return list of all notifications for the member
   */
  public List<Notification> getByMembre(Long idMembre) {
    return notificationRepository.findByMembreIdMembre(idMembre);
  }

  /**
   * Retrieves only unread notifications for a given member.
   *
   * @param idMembre the ID of the member
   * @return list of unread notifications
   */
  public List<Notification> getUnread(Long idMembre) {
    return notificationRepository.findByMembreIdMembreAndEstLue(idMembre, false);
  }

  /**
   * Marks a single notification as read and sets the read date.
   *
   * @param idNotification the ID of the notification to mark as read
   * @return the updated notification
   * @throws RuntimeException if the notification is not found
   */
  public Notification markAsRead(Long idNotification) {
    Notification n = notificationRepository.findById(idNotification)
        .orElseThrow(() -> new RuntimeException("Notification not found"));
    n.setEstLue(true);
    n.setDateLecture(LocalDateTime.now());
    return notificationRepository.save(n);
  }

  /**
   * Marks all unread notifications of a member as read.
   *
   * @param idMembre the ID of the member
   */
  public void markAllAsRead(Long idMembre) {
    List<Notification> unread = notificationRepository
        .findByMembreIdMembreAndEstLue(idMembre, false);
    unread.forEach(n -> {
      n.setEstLue(true);
      n.setDateLecture(LocalDateTime.now());
    });
    notificationRepository.saveAll(unread);
  }

  /**
   * Deletes a notification by its ID.
   *
   * @param idNotification the ID of the notification to delete
   */
  public void delete(Long idNotification) {
    notificationRepository.deleteById(idNotification);
  }
}