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

/** Entity representing a request to join a team. */
@Data
@NoArgsConstructor
@Entity
@Table(name = "demandes")
public class Demande {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long idDemande;

  @Column(nullable = false)
  private LocalDateTime dateDemande = LocalDateTime.now();

  // Foreign key to the applicant user
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "membre_id", nullable = false)
  private User membre;

  // Foreign key to the target team
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "equipe_id", nullable = false)
  private Equipe equipe;

  // Request status (strict enum)
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EtatDemande etat = EtatDemande.EN_ATTENTE;

  @Column(nullable = true)
  private String raisonRefus;

  @Column(nullable = true)
  private LocalDateTime dateTraitement;

  /** Strict list of possible states for a request. */
  public enum EtatDemande {
    EN_ATTENTE,
    ACCEPTEE,
    REFUSEE
  }
}
