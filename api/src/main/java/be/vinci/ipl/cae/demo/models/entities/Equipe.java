package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Entité représentant une équipe dans l'application. */
@Entity
@Table(name = "equipes")
@Data
@NoArgsConstructor
public class Equipe {

  /** L'identifiant unique de l'équipe. */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** Le nom de l'équipe, qui doit être unique et non vide. */
  @Column(unique = true)
  @NotBlank
  private String name;

  /** La liste des membres appartenant à cette équipe. */
  @OneToMany(mappedBy = "equipe", fetch = FetchType.LAZY)
  @JsonManagedReference
  private List<User> membres = new ArrayList<>();

  /**
   * Le membre désigné comme responsable principal de l'équipe. Relation stricte : 1 équipe maximum
   * par chef.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_responsible_id", unique = true)
  @JsonIgnore
  private User responsablePrincipal;

  /**
   * Le membre désigné comme responsable secondaire de l'équipe (optionnel). Relation stricte : 1
   * équipe maximum par chef.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "secondary_responsible_id", unique = true)
  @JsonIgnore
  private User responsableSecondaire;
}
