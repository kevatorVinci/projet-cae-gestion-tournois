package be.vinci.ipl.cae.demo.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "membre")
@Data
public class Membre {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_membre")
  private Long idMembre;

  @Column(name = "username", nullable = false)
  private String username;

  @Column(name = "email", nullable = false, unique = true)
  private String email;

  @Column(name = "mot_de_passe", nullable = false)
  private String motDePasse;
}