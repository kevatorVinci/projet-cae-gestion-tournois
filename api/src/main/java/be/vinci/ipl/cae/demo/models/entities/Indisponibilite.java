package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Entity representing a player's unavailable time period. */
@Entity
@Table(name = "indisponibilites")
@Getter
@Setter
@NoArgsConstructor
public class Indisponibilite {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "date_debut", nullable = false)
  @NotNull
  private LocalDate dateDebut;

  @Column(name = "date_fin", nullable = false)
  @NotNull
  private LocalDate dateFin;

  // Link to the player (one player can have multiple unavailable periods)
  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  @JsonIgnore
  private User user;
}
