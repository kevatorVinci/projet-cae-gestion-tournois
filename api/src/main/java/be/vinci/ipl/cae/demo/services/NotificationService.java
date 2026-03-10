package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.Notification;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// services/NotificationService.java
@Service
public class NotificationService {

  @Autowired
  private NotificationRepository notificationRepository;

  public List<Notification> getByMembre(Long idMembre) {
    return notificationRepository.findByMembre_IdMembre(idMembre);
  }

  public List<Notification> getUnread(Long idMembre) {
    return notificationRepository.findByMembre_IdMembreAndEstLue(idMembre, false);
  }

  public Notification markAsRead(Long idNotification) {
    Notification n = notificationRepository.findById(idNotification)
        .orElseThrow(() -> new RuntimeException("Notification not found"));
    n.setEstLue(true);
    n.setDateLecture(LocalDateTime.now());
    return notificationRepository.save(n);
  }

  public void markAllAsRead(Long idMembre) {
    List<Notification> unread = notificationRepository
        .findByMembre_IdMembreAndEstLue(idMembre, false);
    unread.forEach(n -> {
      n.setEstLue(true);
      n.setDateLecture(LocalDateTime.now());
    });
    notificationRepository.saveAll(unread);
  }

  public void delete(Long idNotification) {
    notificationRepository.deleteById(idNotification);
  }
}