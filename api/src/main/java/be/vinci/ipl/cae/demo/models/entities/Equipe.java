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

/**
 * Entity representing a team in the application.
 */
@Entity
@Table(name = "equipes")
@Data
@NoArgsConstructor
public class Equipe {

  /**
   * The unique identifier of the team.
   */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * The name of the team, which must be unique and not blank.
   */
  @Column(unique = true)
  @NotBlank
  private String name;

  // ✨ WE ADD THE IMAGE FIELD HERE ✨
  /**
   * The profile image of the team.
   * Stores the file name of the image (e.g., "akatsuki.jpg").
   */
  @Column(name = "profile_image")
  private String profileImage;

  /**
   * The list of members belonging to this team.
   */
  @OneToMany(mappedBy = "equipe", fetch = FetchType.LAZY)
  @JsonManagedReference
  private List<User> membres = new ArrayList<>();

  /**
   * The member designated as the primary responsible (leader) of the team.
   * Strict relationship: maximum 1 team per leader.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_responsible_id", unique = true)
  @JsonIgnore
  private User responsablePrincipal;

  /**
   * The member designated as the secondary responsible of the team (optional).
   * Strict relationship: maximum 1 team per leader.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "secondary_responsible_id", unique = true)
  @JsonIgnore
  private User responsableSecondaire;

  /**
   * The list of tournament registrations for this team.
   * OneToMany because 1 team can register for multiple tournaments.
   * mappedBy = "equipe" -> the Foreign Key is in InscriptionEquipeTournoi.
   */
  @OneToMany(mappedBy = "equipe", fetch = FetchType.LAZY)
  @JsonManagedReference("equipe-inscriptions")
  private List<InscriptionEquipeTournoi> inscriptions = new ArrayList<>();
}
