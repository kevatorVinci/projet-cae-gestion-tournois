package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Classe de configuration pour initialiser les données de démo au démarrage. */
@Configuration
public class DataInitializer {

  /**
   * Initialise les utilisateurs et équipes de démo si la DB est vide.
   *
   * @param equipeRepository le repository des équipes
   * @param userRepository le repository des utilisateurs
   * @param passwordEncoder l'encodeur de mots de passe
   * @return un CommandLineRunner exécuté au démarrage
   */
  @Bean
  public CommandLineRunner initDatabase(
      EquipeRepository equipeRepository,
      TournoiRepository tournoiRepository,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder) {
    return args -> {
      if (userRepository.count() > 0 || equipeRepository.count() > 0 || tournoiRepository.count() > 0) {
        return;
      }

      String defaultPassword = passwordEncoder.encode("123");

      // ── Utilisateurs (sans équipe pour l'instant) ─────────────────────────
      User lea = new User();
      lea.setEmail("lea@mail.com");
      lea.setTag("Lynx");
      lea.setSpecialty("tacticien");
      lea.setCreationDate(LocalDate.parse("2025-11-12"));
      lea.setAdmin(false);
      lea.setPassword(defaultPassword);
      lea.setProfileImageUrl("flash.jpg");

      User tom = new User();
      tom.setEmail("tom@mail.com");
      tom.setTag("Rogue");
      tom.setSpecialty("exécuteur");
      tom.setCreationDate(LocalDate.parse("2025-12-03"));
      tom.setAdmin(false);
      tom.setPassword(defaultPassword);
      tom.setProfileImageUrl("miles.jpg");

      User ines = new User();
      ines.setEmail("ines@mail.com");
      ines.setTag("Pulse");
      ines.setSpecialty("guérisseur");
      ines.setCreationDate(LocalDate.parse("2026-01-18"));
      ines.setAdmin(true);
      ines.setPassword(defaultPassword);
      ines.setProfileImageUrl("erza.jpg");

      User tibo = new User();
      tibo.setEmail("tibo@mail.com");
      tibo.setTag("Iron");
      tibo.setSpecialty("gardien");
      tibo.setCreationDate(LocalDate.parse("2025-10-27"));
      tibo.setAdmin(true);
      tibo.setPassword(defaultPassword);
      tibo.setProfileImageUrl("luffy.png");

      // On sauvegarde d'abord sans équipe (les FK equipe sont nullable)
      userRepository.saveAll(List.of(lea, tom, ines, tibo));

      // ── Tournois de démo ────────────────────────────────────────────────
      Tournoi springCup = new Tournoi();
      springCup.setNom("Vinci Spring Cup");
      springCup.setDescription("Tournoi printanier ouvert aux nouvelles équipes.");
      springCup.setDateDebut(LocalDate.parse("2026-04-05"));
      springCup.setDateFin(LocalDate.parse("2026-04-07"));
      springCup.setDateLimiteInscription(LocalDate.parse("2026-04-02"));
      springCup.setEtat("OUVERT");
      springCup.setNombresParticipantsMax(16);

      Tournoi nightMasters = new Tournoi();
      nightMasters.setNom("Night Masters");
      nightMasters.setDescription("Compétition nocturne en BO3.");
      nightMasters.setDateDebut(LocalDate.parse("2026-05-10"));
      nightMasters.setDateFin(LocalDate.parse("2026-05-12"));
      nightMasters.setDateLimiteInscription(LocalDate.parse("2026-05-06"));
      nightMasters.setEtat("CLOTURE");
      nightMasters.setNombresParticipantsMax(8);

      Tournoi arenaFinals = new Tournoi();
      arenaFinals.setNom("Arena Finals");
      arenaFinals.setDescription("Finales annuelles de la Vinci Arena.");
      arenaFinals.setDateDebut(LocalDate.parse("2026-03-01"));
      arenaFinals.setDateFin(LocalDate.parse("2026-03-02"));
      arenaFinals.setDateLimiteInscription(LocalDate.parse("2026-02-20"));
      arenaFinals.setEtat("TERMINE");
      arenaFinals.setNombresParticipantsMax(4);

      tournoiRepository.saveAll(List.of(springCup, nightMasters, arenaFinals));

      // ── Équipes ───────────────────────────────────────────────────────────
      // TEAM_ALPHA : responsable principal = Lea
      Equipe teamAlpha = new Equipe();
      teamAlpha.setName("TEAM_ALPHA");
      teamAlpha.setResponsablePrincipal(lea);
      equipeRepository.save(teamAlpha);

      // TEAM_OMEGA : responsable principal = Tibo
      Equipe teamOmega = new Equipe();
      teamOmega.setName("TEAM_OMEGA");
      teamOmega.setResponsablePrincipal(tibo);
      equipeRepository.save(teamOmega);

      // ── Rattachement des membres à leur équipe ────────────────────────────
      // TEAM_ALPHA : Lea + Tom + Ines
      lea.setEquipe(teamAlpha);
      tom.setEquipe(teamAlpha);
      ines.setEquipe(teamAlpha);

      // TEAM_OMEGA : Tibo
      tibo.setEquipe(teamOmega);

      userRepository.saveAll(List.of(lea, tom, ines, tibo));

      System.out.println("✅ DB initialisée :");
      System.out.println("   TEAM_ALPHA → Lea (resp. principal), Tom, Ines");
      System.out.println("   TEAM_OMEGA → Tibo (resp. principal)");
      System.out.println("   Tournois → Vinci Spring Cup, Night Masters, Arena Finals");
    };
  }
}
