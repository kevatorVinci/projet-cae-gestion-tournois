package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tournois")
@Data
@NoArgsConstructor
public class Tournoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    @NotBlank
    private String nom;

    private String description;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    @NotNull
    private LocalDate dateLimiteInscription;

    // Pas d'enum → simple String, la validation se fait au niveau service
    private String etat;

    private Integer nombresParticipantsMax;

    @OneToMany(mappedBy = "tournoi", fetch = FetchType.LAZY)
    @JsonManagedReference("tournoi-inscriptions")
    private List<InscriptionEquipeTournoi> inscriptions = new ArrayList<>();
}