package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
  @JsonProperty("dateDebut")
  private LocalDate startDate;

  /**
   * The end date of the unavailability period.
   */
  @Column(name = "date_fin", nullable = false)
  @NotNull
  @JsonProperty("dateFin")
  private LocalDate endDate;

  /**
   * The user associated with this unavailability.
   */
  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  @JsonIgnore
  private User user;
}