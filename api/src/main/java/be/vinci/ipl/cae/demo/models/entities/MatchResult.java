package be.vinci.ipl.cae.demo.models.entities;

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
@Table(name = "match_results") // Creates the table named "match_results" in the database
public class MatchResult {

    @Id
    @Column(name = "match_id")
    private Long id;

    /**
     * MapsId tells JPA that the result ID is exactly the same as the match ID.
     */
    @OneToOne
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
    private String validationStatusTeam1;

    @Column(name = "validation_status_team2", nullable = false)
    private String validationStatusTeam2;
}