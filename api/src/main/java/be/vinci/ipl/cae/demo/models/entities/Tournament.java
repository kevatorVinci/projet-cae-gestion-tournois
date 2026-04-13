package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
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

  @Column(name = "nom", unique = true)
  @NotBlank
  private String name;

  private String description;

  @Column(name = "date_debut")
  @NotNull
  private LocalDate startDate;

  @Column(name = "date_fin")
  @NotNull
  private LocalDate endDate;

  @Column(name = "date_limite_inscription")
  @NotNull
  private LocalDate registrationDeadline;

  @Column(name = "etat")
  private String status;

  @Column(name = "nombres_participants_max")
  @Min(value = 2, message = "Un tournoi doit avoir au moins 2 équipes participantes.")
  private Integer maxParticipants;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "id_gagnant")
  @JsonIgnoreProperties({"members", "registrations", "primaryResponsible", "secondaryResponsible"})
  private Team winner;

  @OneToMany(mappedBy = "tournament", fetch = FetchType.LAZY)
  @JsonManagedReference("tournoi-inscriptions")
  private List<RegistrationTeamTournament> registrations = new ArrayList<>();
}