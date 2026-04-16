package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
 * Entity representing a match between two teams in a tournament.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "matches")
public class Match {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_match")
  private Long id;

  /**
   * The tournament this match belongs to.
   */
  @ManyToOne
  @JoinColumn(name = "tournoi_id", nullable = false)
  @JsonIgnoreProperties({"registrations", "winner"})
  private Tournament tournament;

  /**
   * The first team participating in the match.
   */
  @ManyToOne
  @JoinColumn(name = "equipe1_id", nullable = false)
  @JsonIgnoreProperties({"members", "registrations", "primaryResponsible", "secondaryResponsible"})
  @JsonProperty("equipe1")
  private Team team1;

  /**
   * The second team participating in the match.
   */
  @ManyToOne
  @JoinColumn(name = "equipe2_id", nullable = false)
  @JsonIgnoreProperties({"members", "registrations", "primaryResponsible", "secondaryResponsible"})
  @JsonProperty("equipe2")
  private Team team2;

  @Column(name = "date_match")
  @JsonProperty("dateMatch")
  private LocalDateTime matchDate;

  @Column(name = "score_equipe1")
  @JsonProperty("scoreEquipe1")
  private Integer scoreTeam1 = 0;

  @Column(name = "score_equipe2")
  @JsonProperty("scoreEquipe2")
  private Integer scoreTeam2 = 0;

  /**
   * The team that won the match.
   */
  @ManyToOne
  @JoinColumn(name = "vainqueur_id")
  @JsonIgnoreProperties({"members", "registrations", "primaryResponsible", "secondaryResponsible"})
  @JsonProperty("vainqueur")
  private Team winner;

  /**
   * The current status of the match (e.g., PENDING, FINISHED).
   */
  @Column(nullable = false)
  @JsonProperty("statut")
  private String status = "PENDING";

  /**
   * The round number in the tournament.
   */
  @Column(name = "tour_numero")
  @JsonProperty("tourNumero")
  private Integer roundNumber;
}