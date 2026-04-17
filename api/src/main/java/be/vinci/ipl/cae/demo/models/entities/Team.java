package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a team in the application.
 */
@Entity
@Table(name = "equipes")
@Data
@NoArgsConstructor
public class Team {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * The unique name of the team.
   */
  @Column(unique = true)
  @NotBlank
  private String name;

  /**
   * The URL or path to the team's profile image.
   */
  @Column(name = "profile_image")
  private String profileImage;

  /**
   * The list of users who are members of this team.
   */
  @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
  @JsonManagedReference
  private List<User> members = new ArrayList<>();

  /**
   * The primary user responsible for the team.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_responsible_id", unique = true)
  @JsonIgnore
  private User primaryResponsible;

  /**
   * The secondary user responsible for the team.
   */
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "secondary_responsible_id", unique = true)
  @JsonIgnore
  private User secondaryResponsible;

  /**
   * The list of tournament registrations for this team.
   */
  @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
  @JsonManagedReference("equipe-inscriptions")
  private List<RegistrationTeamTournament> registrations = new ArrayList<>();
}