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
public class Team {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true)
  @NotBlank
  private String name;

  @Column(name = "profile_image")
  private String profileImage;

  @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
  @JsonManagedReference
  private List<User> members = new ArrayList<>();

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_responsible_id", unique = true)
  @JsonIgnore
  private User primaryResponsible;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "secondary_responsible_id", unique = true)
  @JsonIgnore
  private User secondaryResponsible;

  @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
  @JsonManagedReference("equipe-inscriptions")
  private List<RegistrationTeamTournament> registrations = new ArrayList<>();
}