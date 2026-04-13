package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Composite key for {@link RegistrationTeamTournament}. */
@Data
@NoArgsConstructor
public class RegistrationTeamTournamentId implements Serializable {

  // Same name as the @Id field in the entity
  private Long tournament; // 🇬🇧 Ancien nom : tournoi

  // Same name as the @Id field in the entity
  private Long team; // 🇬🇧 Ancien nom : equipe
}