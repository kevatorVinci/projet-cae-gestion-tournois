package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité représentant un membre dans l'application.
 */
@Entity
@Table(name = "membres")
@Getter
@Setter
@NoArgsConstructor
public class Membre {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private boolean estAdministrateur;

  @Column(unique = true, nullable = false)
  @NotBlank
  private String mail;

  private String specialite;

  private LocalDateTime dateCreationProfil;

  private String tagJeu;

  private Long imageId;

  @NotBlank
  private String motDePasse;

  /**
   * Relation vers l'équipe du membre. Un membre appartient à une seule équipe.
   */
  @ManyToOne
  @JoinColumn(name = "equipe_id") // FK en DB
  private Equipe equipe;
}
