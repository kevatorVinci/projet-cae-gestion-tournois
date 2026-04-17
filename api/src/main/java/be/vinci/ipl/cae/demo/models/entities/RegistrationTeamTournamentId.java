package be.vinci.ipl.cae.demo.models.entities;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Composite key for {@link RegistrationTeamTournament}.
 */
@Data
@NoArgsConstructor
public class RegistrationTeamTournamentId implements Serializable {

  /**
   * The tournament ID part of the composite key.
   */
  private Long tournament;

  /**
   * The team ID part of the composite key.
   */
  private Long team;
}