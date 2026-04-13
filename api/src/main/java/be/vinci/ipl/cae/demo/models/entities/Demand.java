package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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

  // Foreign key to the applicant user
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "membre_id", nullable = false)
  private User member; // 🇬🇧 Ancien : membre

  // Foreign key to the target team
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "equipe_id", nullable = false)
  private Team team;

  // Request status (strict enum)
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
    PENDING,
    ACCEPTED,
    REJECTED
  }
}