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

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String tag;

  @Column(nullable = false)
  private String specialty;

  @Column(nullable = false)
  private String profileImageUrl;

  @Column(name = "team_name", nullable = true)
  private String teamName;

  @Column(nullable = false)
  private LocalDate creationDate;

  @Column(nullable = false)
  private boolean admin = false;

  @Column(nullable = false)
  private boolean banned = false;

  @Column(nullable = true)
  private String banReason;

  @Column(name = "date_creation_profil")
  private LocalDateTime profileCreationDate;

  @ManyToOne
  @JoinColumn(name = "equipe_id")
  @JsonBackReference
  private Team team;
}