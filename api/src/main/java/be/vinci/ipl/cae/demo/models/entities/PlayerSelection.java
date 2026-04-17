package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing which member plays in which match for which team.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "match_player_selections")
@IdClass(PlayerSelectionId.class) // Tells Spring Boot to use the double ID
public class PlayerSelection {

    @Id
    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Id
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private User member; // User is the "membre" entity in your project

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}