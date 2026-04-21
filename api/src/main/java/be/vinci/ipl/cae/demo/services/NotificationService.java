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
        .orElseThrow(() -> new RuntimeException("Notification introuvable"));

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
        "Bienvenue : votre compte a été créé. Rejoignez ou créez une équipe pour commencer !");
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
        "Équipe créée : vous êtes maintenant le responsable de l'équipe '" + teamName + "'."
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
        "Demande envoyée : votre requête pour rejoindre l'équipe '" + teamName
            + "' est en attente."
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
        "Nouvelle demande : " + candidateTag + " souhaite rejoindre l'équipe '" + teamName + "'."
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
        "Accepté : votre demande pour rejoindre '" + teamName + "' a été acceptée. Bienvenue !"
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
        (reason == null || reason.isBlank()) ? "Aucune raison fournie." : reason;

    createNotification(
        user,
        "Refusé : votre demande pour rejoindre l'équipe '" + teamName
            + "' a été refusée. Raison : " + displayedReason
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
        "Admin : le tournoi brouillon '" + tournamentName
            + "' a été créé. Publiez-le quand vous êtes prêt."
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
        "Nouveau tournoi : le tournoi '" + tournamentName
            + "' vient d'être publié. Inscrivez-vous vite !"
    );
  }

  /**
   * Notifies all members of a team that they have forfeited and are eliminated.
   *
   * @param members the list of team members to notify
   * @param tournamentName the name of the tournament
   */
  public void notifyForfeit(List<User> members, String tournamentName) {
    for (User member : members) {
      createNotification(
          member,
          "🏳️ Forfait — "
              + tournamentName
              + " : Votre équipe a déclaré forfait. Vous êtes éliminés du tournoi."
      );
    }
  }
}