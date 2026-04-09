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

  // Read operations

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

  // Mark operations

  /**
   * Marks one notification as read.
   *
   * @param idNotification notification id
   * @return updated notification
   */
  public Notification markAsRead(Long idNotification) {
    Notification n = notificationRepository
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
    List<Notification> unread = notificationRepository.findByUserIdAndEstLueOrderByDateEnvoiDesc(userId, false);
    unread.forEach(n -> n.setEstLue(true));
    notificationRepository.saveAll(unread);
  }

  // Delete operations

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

  // Create operation (base method)

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
    notification.setEstLue(false);
    return notificationRepository.save(notification);
  }

  // Business notifications (prefixes used by the React frontend)

  /** Sent to a member when they create their account. */
  public void notifierCreationCompte(User user) {
    createNotification(
        user,
        "Bienvenue : ton compte a bien été créé. Rejoins ou crée une équipe pour commencer !");
  }

  /** Sent to a member when they create a team. */
  public void notifierCreationEquipe(User user, String nomEquipe) {
    createNotification(
        user, "Équipe créée : tu es maintenant responsable de l'équipe '" + nomEquipe + "'.");
  }

  /** Sent to a member when a tournament is created. */
  public void notifierCreationTournoi(User user, String nomTournoi) {
    createNotification(
        user,
        "Nouveau tournoi : '" + nomTournoi
            + "' vient d'être créé. Consulte la liste des tournois !");
  }

  /** Sent to a member when their request is submitted. */
  public void notifierDemandEnvoyee(User user, String nomEquipe) {
    createNotification(
        user,
        "Demande envoyée : ta candidature pour rejoindre '" + nomEquipe + "' est en attente.");
  }

  /** Sent to the primary responsible user when a new application is received. */
  public void notifierNouvelleDemandeResponsable(
      User responsable, String tagCandidat, String nomEquipe) {
    createNotification(
        responsable,
        "Nouvelle demande : "
            + tagCandidat
            + " souhaite rejoindre l'équipe '"
            + nomEquipe
            + "'.");
  }

  /** Sent to a member when their request is accepted. */
  public void notifierDemandeAcceptee(User user, String nomEquipe) {
    createNotification(
        user,
        "Accepté : ta demande pour rejoindre '" + nomEquipe + "' a été acceptée. Bienvenue !");
  }

  /** Sent to a member when their request is rejected. */
  public void notifierDemandeRefusee(User user, String nomEquipe, String raison) {
    String raionAffichee = (raison == null || raison.isBlank()) ? "Aucune raison précisée." : raison;
    createNotification(
        user,
        "Refus : ta demande pour rejoindre '"
            + nomEquipe
            + "' a été refusée. Raison : "
            + raionAffichee);
  }

  /** Sent to admins when a tournament is created in draft state. */
  public void notifierCreationTournoiBrouillon(User admin, String nomTournoi) {
    createNotification(
        admin,
        "Admin : nouveau tournoi en brouillon '" + nomTournoi + "'. À publier quand prêt.");
  }

  /** Sent to all players when a tournament is published. */
  public void notifierPublicationTournoi(User user, String nomTournoi) {
    createNotification(
        user,
        "Nouveau tournoi : '" + nomTournoi + "' vient d'être publié. Inscris-toi maintenant !");
  }
}
