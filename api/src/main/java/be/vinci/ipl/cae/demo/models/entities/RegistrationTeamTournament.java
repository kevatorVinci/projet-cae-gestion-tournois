package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Registration entity linking one team to one tournament.
 *
 * <p>The entity uses a composite key made of tournament id and team id.
 */
@Entity
@Table(name = "inscription_equipe_tournoi")
@IdClass(RegistrationTeamTournamentId.class)
@Data
@NoArgsConstructor
public class RegistrationTeamTournament {

  /**
   * The tournament the team is registering for.
   */
  @Id
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "id_tournoi")
  @JsonBackReference("tournoi-inscriptions")
  private Tournament tournament;

  /**
   * The team registering for the tournament.
   */
  @Id
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "id_equipe")
  @JsonBackReference("equipe-inscriptions")
  private Team team;

  /**
   * The date when the team registered for the tournament.
   */
  @Column(name = "date_inscription")
  private LocalDate registrationDate;
}