package be.vinci.ipl.cae.demo.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Cette classe représente un membre de la plateforme Vinci Arena.
 * Elle contient toutes les informations nécessaires à son profil.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity(name = "users") // Nom de la table en base de données
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identifiant unique auto-généré

    @Column(unique = true, nullable = false)
    private String email; // Sert de login, doit être unique [cite: 32]

    @Column(nullable = false)
    private String password; // Mot de passe du membre [cite: 33]

    @Column(nullable = false)
    private String tag; // Le pseudo dans le jeu

    @Column(nullable = false)
    private String specialty; // Spécialité (ex: architecte, tacticien...) [cite: 35]

    @Column(nullable = false)
    private String profileImageUrl; // Image de profil choisie parmi la base prédéfinie [cite: 29]

    @Column(nullable = true)
    private String team;

    @Column(nullable = false)
    private java.time.LocalDate creationDate;

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getTag() {
        return tag;
    }

    public String getSpecialty() {
        return specialty;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getTeam() {
        return team;
    }

    public LocalDate getCreationDate() {
        return creationDate;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public void setCreationDate(LocalDate creationDate) {
        this.creationDate = creationDate;
    }
}