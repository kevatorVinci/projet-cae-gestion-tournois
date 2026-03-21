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

/** Entité représentant un utilisateur. */
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

  @Column(nullable = true)
  private String team;

  @Column(nullable = false)
  private LocalDate creationDate;

  @Column(nullable = false)
  private boolean admin = false;

  private LocalDateTime dateCreationProfil;

  /** Team membership relation. */
  @ManyToOne
  @JoinColumn(name = "equipe_id")
  @JsonBackReference
  private Equipe equipe;
}
