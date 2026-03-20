package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inscription_equipe_tournoi")
@IdClass(InscriptionEquipeTournoiId.class)
@Data
@NoArgsConstructor
public class InscriptionEquipeTournoi {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tournoi")
    @JsonBackReference("tournoi-inscriptions")
    private Tournoi tournoi;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipe")
    @JsonBackReference("equipe-inscriptions")
    private Equipe equipe;

    private LocalDate dateInscription;

    // Pas d'enum → simple String
    private String etat;
}