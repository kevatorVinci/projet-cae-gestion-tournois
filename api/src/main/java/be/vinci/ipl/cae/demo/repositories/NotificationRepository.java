package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing notifications in the database.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

  /**
   * Finds all notifications for a given user.
   *
   * @param userId the user id
   * @return list of notifications belonging to the user
   */
  List<Notification> findByUserIdOrderBySentDateDesc(Long userId); // 🇬🇧 Ancien : findByUserIdOrderByDateEnvoiDesc

  /**
   * Finds all notifications for a given user filtered by read status.
   *
   * @param userId the user id
   * @param isRead whether the notification has been read
   * @return list of notifications matching the criteria
   */
  List<Notification> findByUserIdAndIsReadOrderBySentDateDesc(Long userId, Boolean isRead); // 🇬🇧 Ancien : findByUserIdAndEstLue...

  /**
   * Deletes all notifications belonging to a given user.
   *
   * @param userId user id
   */
  void deleteByUserId(Long userId);
}