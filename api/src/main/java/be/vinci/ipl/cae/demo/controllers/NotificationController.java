package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.services.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  /** Toutes les notifications d'un membre (lues + non lues), les plus récentes en premier. */
  @GetMapping("/users/{userId}")
  public ResponseEntity<List<Notification>> getAll(@PathVariable Long userId) {
    return ResponseEntity.ok(notificationService.getByUser(userId));
  }

  /** Uniquement les notifications non lues d'un membre. */
  @GetMapping("/users/{userId}/non-lues")
  public ResponseEntity<List<Notification>> getUnread(@PathVariable Long userId) {
    return ResponseEntity.ok(notificationService.getUnread(userId));
  }

  /** Marque une notification spécifique comme lue. */
  @PatchMapping("/{idNotification}/lue")
  public ResponseEntity<Notification> markAsRead(@PathVariable Long idNotification) {
    return ResponseEntity.ok(notificationService.markAsRead(idNotification));
  }

  /** Marque toutes les notifications d'un membre comme lues. */
  @PatchMapping("/users/{userId}/tous-lues")
  public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
    notificationService.markAllAsRead(userId);
    return ResponseEntity.noContent().build();
  }
}