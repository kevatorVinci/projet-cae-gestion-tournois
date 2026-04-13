package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Composite key for {@link RegistrationTeamTournament}. */
@Data
@NoArgsConstructor
public class RegistrationTeamTournamentId implements Serializable {

  // Same name as the @Id field in the entity
  // Type = PK type of Tournoi (Long)
  private Long tournoi;

  // Same name as the @Id field in the entity
  // Type = PK type of Equipe (Long)
  private Long equipe;
}
