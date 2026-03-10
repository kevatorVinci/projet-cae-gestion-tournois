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

  // ─── Lecture ─────────────────────────────────────────────────────────────────

  public List<Notification> getByUser(Long userId) {
    return notificationRepository.findByUser_IdOrderByDateEnvoiDesc(userId);
  }

  public List<Notification> getUnread(Long userId) {
    return notificationRepository.findByUser_IdAndEstLueOrderByDateEnvoiDesc(userId, false);
  }

  // ─── Marquage ────────────────────────────────────────────────────────────────

  public Notification markAsRead(Long idNotification) {
    Notification n = notificationRepository.findById(idNotification)
            .orElseThrow(() -> new RuntimeException("Notification introuvable"));
    n.setEstLue(true);
    return notificationRepository.save(n);
  }

  public void markAllAsRead(Long userId) {
    List<Notification> unread =
            notificationRepository.findByUser_IdAndEstLueOrderByDateEnvoiDesc(userId, false);
    unread.forEach(n -> n.setEstLue(true));
    notificationRepository.saveAll(unread);
  }

  // ─── Suppression ─────────────────────────────────────────────────────────────

  public void deleteByUser(Long userId) {
    notificationRepository.deleteById(userId);
  }

  public void delete(Long idNotification) {
    notificationRepository.deleteById(idNotification);
  }

  // ─── Création (méthode de base) ───────────────────────────────────────────────

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
    createNotification(user,
            "Bienvenue : ton compte a bien été créé. Rejoins ou crée une équipe pour commencer !");
  }

  /** Envoyée au membre quand il crée une équipe. */
  public void notifierCreationEquipe(User user, String nomEquipe) {
    createNotification(user,
            "Équipe créée : tu es maintenant responsable de l'équipe '" + nomEquipe + "'.");
  }

  /** Envoyée au membre quand sa demande est envoyée. */
  public void notifierDemandEnvoyee(User user, String nomEquipe) {
    createNotification(user,
            "Demande envoyée : ta candidature pour rejoindre '" + nomEquipe + "' est en attente.");
  }

  /** Envoyée au responsable principal quand une nouvelle candidature est reçue. */
  public void notifierNouvelleDemandeResponsable(
      User responsable, String tagCandidat, String nomEquipe) {
    createNotification(
        responsable,
        "Nouvelle demande : "
            + tagCandidat
            + " souhaite rejoindre l'equipe '"
            + nomEquipe
            + "'.");
  }


  /** Envoyée au membre quand sa demande est acceptée. */
  public void notifierDemandeAcceptee(User user, String nomEquipe) {
    createNotification(user,
            "Accepté : ta demande pour rejoindre '" + nomEquipe + "' a été acceptée. Bienvenue !");
  }

  /** Envoyée au membre quand sa demande est refusée. */
  public void notifierDemandeRefusee(User user, String nomEquipe, String raison) {
    String raionAffichee = (raison == null || raison.isBlank()) ? "Aucune raison précisée." : raison;
    createNotification(user,
            "Refus : ta demande pour rejoindre '" + nomEquipe + "' a été refusée. Raison : " + raionAffichee);
  }
}