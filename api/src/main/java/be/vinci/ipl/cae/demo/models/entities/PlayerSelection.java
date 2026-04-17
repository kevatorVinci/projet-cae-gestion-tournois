package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing which member plays in which match for which team.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "match_player_selections")
@IdClass(PlayerSelectionId.class)
public class PlayerSelection {

    @Id
    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Id
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}