package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Composite key for {@link InscriptionEquipeTournoi}. */
@Data
@NoArgsConstructor
public class InscriptionEquipeTournoiId implements Serializable {

  // Même nom que le champ @Id dans l'entité
  // Type = type de la PK de Tournoi (qui est Long)
  private Long tournoi;

  // Même nom que le champ @Id dans l'entité
  // Type = type de la PK de Equipe (qui est Long)
  private Long equipe;
}
