package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Data;
import lombok.NoArgsConstructor;

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

  @Id
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "id_tournoi")
  @JsonBackReference("tournoi-inscriptions")
  private Tournament tournoi;

  @Id
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "id_equipe")
  @JsonBackReference("equipe-inscriptions")
  private Team equipe;

  private LocalDate dateInscription;


}
