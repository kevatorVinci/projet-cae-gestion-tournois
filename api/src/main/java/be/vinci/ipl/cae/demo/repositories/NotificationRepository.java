package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
  List<Notification> findByMembre_IdMembre(Long idMembre);
  List<Notification> findByMembre_IdMembreAndEstLue(Long idMembre, Boolean estLue);
}