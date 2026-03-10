package be.vinci.ipl.cae.demo.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import be.vinci.ipl.cae.demo.models.entities.Notification;

/**
 * Repository for managing notifications in the database.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

  /**
   * Finds all notifications for a given member.
   *
   * @param idMembre the ID of the member
   * @return list of notifications belonging to the member
   */
  List<Notification> findByMembreIdMembre(Long idMembre);

  /**
   * Finds all notifications for a given member filtered by read status.
   *
   * @param idMembre the ID of the member
   * @param estLue whether the notification has been read
   * @return list of notifications matching the criteria
   */
  List<Notification> findByMembreIdMembreAndEstLue(Long idMembre, Boolean estLue);
}