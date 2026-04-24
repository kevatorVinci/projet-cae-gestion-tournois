package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Composite key for {@link RegistrationTeamTournament}. */
@Data
@NoArgsConstructor
public class RegistrationTeamTournamentId implements Serializable {

  /** The tournament ID part of the composite key. */
  private Long tournament;

  /** The team ID part of the composite key. */
  private Long team;
}
