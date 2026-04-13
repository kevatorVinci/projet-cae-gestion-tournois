package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Entity representing a single match between two teams in a tournament.
 */
@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The tournament this match belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    @JsonBackReference("tournament-matches")
    private Tournament tournament;

    /** The first team playing in the match. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team1_id")
    private Team team1;

    /** The second team playing in the match. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team2_id")
    private Team team2;

    /** The score of the first team (null if the match hasn't been played yet). */
    @Column(name = "score_team1")
    private Integer scoreTeam1;

    /** The score of the second team (null if the match hasn't been played yet). */
    @Column(name = "score_team2")
    private Integer scoreTeam2;

    /** The scheduled date and time for the match. */
    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    /** * The round of the tournament (e.g., "Quarter-Finals", "Round 1").
     */
    @Column(name = "round_name")
    private String roundName;

    /** * The current status of the match (e.g., "SCHEDULED", "IN_PROGRESS", "FINISHED").
     */
    @Column(name = "status", nullable = false)
    private String status = "SCHEDULED";

    /** * The admin user who encoded the final result of the match.
     * Null if the match hasn't been played or encoded yet.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_encoded_by_id")
    private User resultEncodedBy;
}