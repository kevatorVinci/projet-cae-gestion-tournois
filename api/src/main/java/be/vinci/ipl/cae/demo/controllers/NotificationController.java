package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.Notification;
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

// controllers/NotificationController.java
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  @Autowired
  private NotificationService notificationService;

  // GET all notifications for a member
  @GetMapping("/membre/{idMembre}")
  public ResponseEntity<List<Notification>> getAll(@PathVariable Long idMembre) {
    return ResponseEntity.ok(notificationService.getByMembre(idMembre));
  }

  // GET only unread
  @GetMapping("/membre/{idMembre}/non-lues")
  public ResponseEntity<List<Notification>> getUnread(@PathVariable Long idMembre) {
    return ResponseEntity.ok(notificationService.getUnread(idMembre));
  }

  // PATCH mark one as read
  @PatchMapping("/{idNotification}/lue")
  public ResponseEntity<Notification> markAsRead(@PathVariable Long idNotification) {
    return ResponseEntity.ok(notificationService.markAsRead(idNotification));
  }

  // PATCH mark all as read
  @PatchMapping("/membre/{idMembre}/tous-lue")
  public ResponseEntity<Void> markAllAsRead(@PathVariable Long idMembre) {
    notificationService.markAllAsRead(idMembre);
    return ResponseEntity.noContent().build();
  }

  // DELETE one notification
  @DeleteMapping("/{idNotification}")
  public ResponseEntity<Void> delete(@PathVariable Long idNotification) {
    notificationService.delete(idNotification);
    return ResponseEntity.noContent().build();
  }
}