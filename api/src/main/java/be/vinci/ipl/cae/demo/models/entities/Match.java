package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * Entity representing a match in a tournament.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "matches")
public class Match {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  private Long id;

  @ManyToOne
  @JoinColumn(name = "tournament_id", nullable = false)
  private Tournament tournament;

  @ManyToOne
  @JoinColumn(name = "team1_id")
  private Team team1;

  @ManyToOne
  @JoinColumn(name = "team2_id")
  private Team team2;

  @Column(name = "round_number", nullable = false)
  private int round;

  @Column(name = "scheduled_date_time", nullable = false)
  private LocalDateTime scheduledDateTime;

  @Column(name = "status", nullable = false)
  private String status = "PENDING";

  @ManyToOne
  @JoinColumn(name = "admin_responsible_id", nullable = false)
  private User adminResponsible;

  /**
   * The link to the match result.
   */
  @OneToOne(mappedBy = "match", cascade = CascadeType.ALL)
  @ToString.Exclude
  @EqualsAndHashCode.Exclude
  private MatchResult result;
}