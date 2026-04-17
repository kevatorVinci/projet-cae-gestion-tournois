package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a request to join a team.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "demandes")
public class Demand {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_demande")
  private Long id;

  @Column(name = "date_demande", nullable = false)
  private LocalDateTime requestDate = LocalDateTime.now();

  /**
   * Foreign key to the applicant user.
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "membre_id", nullable = false)
  private User member;

  /**
   * Foreign key to the target team.
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "equipe_id", nullable = false)
  private Team team;

  /**
   * Request status (strict enum).
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "etat", nullable = false)
  private DemandState state = DemandState.PENDING;

  @Column(name = "raison_refus", nullable = true)
  private String rejectionReason;

  @Column(name = "date_traitement", nullable = true)
  private LocalDateTime processingDate;

  /**
   * Strict list of possible states for a request.
   */
  public enum DemandState {
    /**
     * The demand is waiting for a decision.
     */
    PENDING,
    /**
     * The demand has been accepted.
     */
    ACCEPTED,
    /**
     * The demand has been refused.
     */
    REJECTED
  }
}