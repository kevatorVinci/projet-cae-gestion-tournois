package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByMembreIdMembre(Long idMembre);
    List<Notification> findByMembreIdMembreAndEstLue(Long idMembre, Boolean estLue);
}