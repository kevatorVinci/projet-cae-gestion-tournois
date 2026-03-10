package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.services.NotificationService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing notifications.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  @Autowired
  private NotificationService notificationService;

  /**
   * Retrieves all notifications for a given member.
   *
   * @param userId the ID of the user
   * @return list of all notifications for the member
   */
  @GetMapping("/users/{userId}")
  public ResponseEntity<List<Notification>> getAll(@PathVariable Long userId) {
    return ResponseEntity.ok(notificationService.getByUser(userId));
  }

  /**
   * Retrieves only unread notifications for a given member.
   *
   * @param userId the ID of the user
   * @return list of unread notifications
   */
  @GetMapping("/users/{userId}/non-lues")
  public ResponseEntity<List<Notification>> getUnread(@PathVariable Long userId) {
    return ResponseEntity.ok(notificationService.getUnread(userId));
  }

  /**
   * Marks a single notification as read.
   *
   * @param idNotification the ID of the notification to mark as read
   * @return the updated notification
   */
  @PatchMapping("/{idNotification}/lue")
  public ResponseEntity<Notification> markAsRead(@PathVariable Long idNotification) {
    return ResponseEntity.ok(notificationService.markAsRead(idNotification));
  }

  /**
   * Marks all notifications of a member as read.
   *
   * @param userId the ID of the user
   * @return empty response with no content status
   */
  @PatchMapping("/users/{userId}/tous-lue")
  public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
    notificationService.markAllAsRead(userId);
    return ResponseEntity.noContent().build();
  }

  /**
   * Deletes a notification by its ID.
   *
   * @param idNotification the ID of the notification to delete
   * @return empty response with no content status
   */
  @DeleteMapping("/{idNotification}")
  public ResponseEntity<Void> delete(@PathVariable Long idNotification) {
    notificationService.delete(idNotification);
    return ResponseEntity.noContent().build();
  }
}
