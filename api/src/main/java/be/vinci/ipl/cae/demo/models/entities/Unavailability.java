package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Entity representing a player's unavailable time period.
 */
@Entity
@Table(name = "indisponibilites")
@Getter
@Setter
@NoArgsConstructor
public class Unavailability {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * The start date of the unavailability period.
   */
  @Column(name = "date_debut", nullable = false)
  @NotNull
  private LocalDate startDate;

  /**
   * The end date of the unavailability period.
   */
  @Column(name = "date_fin", nullable = false)
  @NotNull
  private LocalDate endDate;

  /**
   * The user associated with this unavailability.
   */
  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  @JsonIgnore
  private User user;
}