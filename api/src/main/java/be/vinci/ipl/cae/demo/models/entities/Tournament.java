package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a tournament lifecycle and its team registrations.
 */
@Entity
@Table(name = "tournois")
@Data
@NoArgsConstructor
public class Tournament {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * The unique name of the tournament.
   */
  @Column(name = "nom", unique = true)
  @NotBlank
  @JsonProperty("nom")
  private String name;

  /**
   * Detailed description of the tournament.
   */
  private String description;

  /**
   * The date when the tournament starts.
   */
  @Column(name = "date_debut")
  @NotNull
  @JsonProperty("dateDebut")
  private LocalDate startDate;

  /**
   * The date when the tournament ends.
   */
  @Column(name = "date_fin")
  @NotNull
  @JsonProperty("dateFin")
  private LocalDate endDate;

  /**
   * The deadline for teams to register.
   */
  @Column(name = "date_limite_inscription")
  @NotNull
  @JsonProperty("dateLimiteInscription")
  private LocalDate registrationDeadline;

  /**
   * Current status of the tournament (e.g., PENDING, ONGOING, FINISHED).
   */
  @Column(name = "etat")
  @JsonProperty("etat")
  private String status;

  /**
   * Maximum number of participating teams allowed.
   */
  @Column(name = "nombres_participants_max")
  @Min(value = 2, message = "Un tournoi doit avoir au moins 2 équipes participantes.")
  @JsonProperty("nombresParticipantsMax")
  private Integer maxParticipants;

  /**
   * Whether generated matches are visible to non-admin users.
   */
  @Column(name = "planning_match_publie", nullable = false)
  @JsonProperty("planningMatchPublie")
  private boolean matchSchedulePublished = false;

  /**
   * The team that won the tournament.
   */
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "id_gagnant")
  @JsonIgnoreProperties({"members", "registrations", "primaryResponsible", "secondaryResponsible"})
  @JsonProperty("gagnant")
  private Team winner;

  /**
   * List of team registrations for this tournament.
   */
  @OneToMany(mappedBy = "tournament", fetch = FetchType.LAZY)
  @JsonManagedReference("tournoi-inscriptions")
  private List<RegistrationTeamTournament> registrations = new ArrayList<>();
}