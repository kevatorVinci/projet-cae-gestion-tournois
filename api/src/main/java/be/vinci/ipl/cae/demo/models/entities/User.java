package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a user.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * The unique email address of the user.
   */
  @Column(unique = true, nullable = false)
  private String email;

  /**
   * The hashed password of the user.
   */
  @Column(nullable = false)
  private String password;

  /**
   * The nickname or tag of the user.
   */
  @Column(nullable = false)
  private String tag;

  /**
   * The player's specialty or role.
   */
  @Column(nullable = false)
  private String specialty;

  /**
   * The URL or path to the user's profile image.
   */
  @Column(nullable = false)
  private String profileImageUrl;

  /**
   * Optional name of the team the user belongs to.
   */
  @Column(name = "team_name", nullable = true)
  private String teamName;

  /**
   * The date when the user account was created.
   */
  @Column(nullable = false)
  private LocalDate creationDate;

  /**
   * Whether the user has administrator privileges.
   */
  @Column(nullable = false)
  private boolean admin = false;

  /**
   * Whether the user is currently banned from the platform.
   */
  @Column(nullable = false)
  private boolean banned = false;

  /**
   * The reason why the user was banned, if applicable.
   */
  @Column(nullable = true)
  private String banReason;

  /**
   * The exact date and time the profile was created.
   */
  @Column(name = "date_creation_profil")
  private LocalDateTime profileCreationDate;

  /**
   * The team the user is currently a member of.
   */
  @ManyToOne
  @JoinColumn(name = "equipe_id")
  @JsonBackReference
  private Team team;
}