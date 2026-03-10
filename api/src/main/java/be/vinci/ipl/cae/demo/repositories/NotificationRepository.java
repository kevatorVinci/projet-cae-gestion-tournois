package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
  List<Notification> findByUser_IdOrderByDateEnvoiDesc(Long userId);

  /**
   * Finds all notifications for a given user filtered by read status.
   *
   * @param userId the user id
   * @param estLue whether the notification has been read
   * @return list of notifications matching the criteria
   */
  List<Notification> findByUser_IdAndEstLueOrderByDateEnvoiDesc(Long userId, Boolean estLue);


}
