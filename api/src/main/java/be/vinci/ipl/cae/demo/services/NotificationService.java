package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/** Service layer for notification retrieval, creation and state updates. */
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

  // ─── Lecture ─────────────────────────────────────────────────────────────────

  /**
   * Gets all notifications for a user.
   *
   * @param userId user id
   * @return notifications ordered by newest first
   */
  public List<Notification> getByUser(Long userId) {
    return notificationRepository.findByUserIdOrderByDateEnvoiDesc(userId);
  }

  /**
   * Gets unread notifications for a user.
   *
   * @param userId user id
   * @return unread notifications
   */
  public List<Notification> getUnread(Long userId) {
    return notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(userId, false);
  }

  // ─── Marquage ────────────────────────────────────────────────────────────────

  /**
   * Marks one notification as read.
   *
   * @param idNotification notification id
   * @return updated notification
   */
  public Notification markAsRead(Long idNotification) {
    Notification n =
        notificationRepository
            .findById(idNotification)
            .orElseThrow(() -> new RuntimeException("Notification introuvable"));
    n.setEstLue(true);
    return notificationRepository.save(n);
  }

  /**
   * Marks all notifications of a user as read.
   *
   * @param userId user id
   */
  public void markAllAsRead(Long userId) {
    List<Notification> unread =
        notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(userId, false);
    unread.forEach(n -> n.setEstLue(true));
    notificationRepository.saveAll(unread);
  }

  // ─── Suppression ─────────────────────────────────────────────────────────────

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
   * @param idNotification notification id
   */
  public void delete(Long idNotification) {
    notificationRepository.deleteById(idNotification);
  }

  // ─── Création (méthode de base) ───────────────────────────────────────────────

  /**
   * Creates one notification message.
   *
   * @param user recipient
   * @param message notification text
   * @return persisted notification
   */
  public Notification createNotification(User user, String message) {
    Notification notification = new Notification();
    notification.setUser(user);
    notification.setMessage(message);
    notification.setEstLue(false);
    return notificationRepository.save(notification);
  }

  // ─── Notifications métier (préfixes pour le front React) ─────────────────────

  /** Envoyée au membre quand il crée son compte. */
  public void notifierCreationCompte(User user) {
    createNotification(
        user,
        "Bienvenue : ton compte a bien été créé. Rejoins ou crée une équipe pour commencer !");
  }

  /** Envoyée au membre quand il crée une équipe. */
  public void notifierCreationEquipe(User user, String nomEquipe) {
    createNotification(
        user, "Équipe créée : tu es maintenant responsable de l'équipe '" + nomEquipe + "'.");
  }

  /** Envoyée au membre quand sa demande est envoyée. */
  public void notifierDemandEnvoyee(User user, String nomEquipe) {
    createNotification(
        user,
        "Demande envoyée : ta candidature pour rejoindre '" + nomEquipe + "' est en attente.");
  }

  /** Envoyée au responsable principal quand une nouvelle candidature est reçue. */
  public void notifierNouvelleDemandeResponsable(
      User responsable, String tagCandidat, String nomEquipe) {
    createNotification(
        responsable,
        "Nouvelle demande : " + tagCandidat + " souhaite rejoindre l'équipe '" + nomEquipe + "'.");
  }

  /** Envoyée au membre quand sa demande est acceptée. */
  public void notifierDemandeAcceptee(User user, String nomEquipe) {
    createNotification(
        user,
        "Accepté : ta demande pour rejoindre '" + nomEquipe + "' a été acceptée. Bienvenue !");
  }

  /** Envoyée au membre quand sa demande est refusée. */
  public void notifierDemandeRefusee(User user, String nomEquipe, String raison) {
    String raionAffichee =
        (raison == null || raison.isBlank()) ? "Aucune raison précisée." : raison;
    createNotification(
        user,
        "Refus : ta demande pour rejoindre '"
            + nomEquipe
            + "' a été refusée. Raison : "
            + raionAffichee);
  }
}
