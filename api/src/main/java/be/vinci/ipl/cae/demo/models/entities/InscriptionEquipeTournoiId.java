package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import java.util.Objects;
import lombok.Data;
import lombok.NoArgsConstructor;

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