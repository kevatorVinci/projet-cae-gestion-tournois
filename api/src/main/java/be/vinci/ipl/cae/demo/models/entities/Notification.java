package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

  /**
   * The user who receives this notification.
   */
  @ManyToOne
  @JoinColumn(name = "id_membre", nullable = false)
  private User user;
}