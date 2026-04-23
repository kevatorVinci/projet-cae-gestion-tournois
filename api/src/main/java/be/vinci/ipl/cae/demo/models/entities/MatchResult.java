package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entity representing the final result of a match.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "match_results")
public class MatchResult {

  @Id
  @Column(name = "match_id")
  private Long id;

  @OneToOne(cascade = CascadeType.MERGE)
  @MapsId
  @JoinColumn(name = "match_id")
  @ToString.Exclude
  @EqualsAndHashCode.Exclude
  private Match match;

  @Column(name = "score_team1", nullable = false)
  private int scoreTeam1 = 0;

  @Column(name = "score_team2", nullable = false)
  private int scoreTeam2 = 0;

  @Column(name = "is_forfeit_team1", nullable = false)
  private boolean isForfeitTeam1 = false;

  @Column(name = "is_forfeit_team2", nullable = false)
  private boolean isForfeitTeam2 = false;

  @Column(name = "encoding_date", nullable = false)
  private LocalDateTime encodingDate;

  @ManyToOne
  @JoinColumn(name = "admin_encoder_id", nullable = false)
  private User adminEncoder;

  @Column(name = "validation_status_team1", nullable = false)
  private String validationStatusTeam1 = "PENDING";

  @Column(name = "validation_status_team2", nullable = false)
  private String validationStatusTeam2 = "PENDING";

  @Column(name = "is_definitive", nullable = false)
  private boolean isDefinitive = false;
  public void setMatch(Match match) {
    this.match = match;
    if (match != null) {
      this.id = match.getId();
    }
  }
}