package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification entity linked to a user account.
 */
@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_notification")
  private Long id;

  @Column(name = "message", nullable = false)
  private String message;

  @Column(name = "date_envoi", nullable = false)
  private LocalDateTime sentDate = LocalDateTime.now();

  @Column(name = "est_lue", nullable = false)
  private Boolean isRead = false;

  @ManyToOne
  @JoinColumn(name = "id_membre", nullable = false)
  private User user;
}