package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.NotificationMapper;
import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints for user notifications. */
@RestController
@RequestMapping("/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

  private final NotificationService notificationService;
  private final NotificationMapper notificationMapper;

  /**
   * Builds the notification controller.
   *
   * @param notificationService notification business service
   */
  public NotificationController(
      NotificationService notificationService,
      NotificationMapper notificationMapper) {
    this.notificationService = notificationService;
    this.notificationMapper = notificationMapper;
  }

  /** Toutes les notifications d'un membre (lues + non lues), les plus récentes en premier. */
  @GetMapping("/users/{userId}")
  public ResponseEntity<List<NotificationDto>> getAll(
      @PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
    return ResponseEntity.ok(notificationMapper.toDtos(notificationService.getByUser(userId)));
  }

  /** Uniquement les notifications non lues d'un membre. */
  @GetMapping("/users/{userId}/non-lues")
  public ResponseEntity<List<NotificationDto>> getUnread(
      @PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
    return ResponseEntity.ok(notificationMapper.toDtos(notificationService.getUnread(userId)));
  }

  /** Marque une notification spécifique comme lue. */
  @PatchMapping("/{idNotification}/lue")
  public ResponseEntity<NotificationDto> markAsRead(
      @PathVariable Long idNotification, @AuthenticationPrincipal User currentUser) {
    return ResponseEntity.ok(
        notificationMapper.toDto(notificationService.markAsRead(idNotification)));
  }

  /** Marque toutes les notifications d'un membre comme lues. */
  @PatchMapping("/users/{userId}/tous-lues")
  public ResponseEntity<Void> markAllAsRead(
      @PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
    notificationService.markAllAsRead(userId);
    return ResponseEntity.noContent().build();
  }
}
