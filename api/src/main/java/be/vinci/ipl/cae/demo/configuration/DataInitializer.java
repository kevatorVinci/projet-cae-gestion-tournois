package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Initialise la base de données avec des utilisateurs de test.
 */
@Configuration
public class DataInitializer {

  /**
   * Crée des utilisateurs par défaut au démarrage.
   *
   * @param userRepository le dépôt des utilisateurs
   * @param passwordEncoder l'outil de cryptage
   * @return une instance de CommandLineRunner
   */
  @Bean
  public CommandLineRunner initDatabase(UserRepository userRepository,
      PasswordEncoder passwordEncoder) {
    return args -> {
      // Nettoyage de la base pour éviter les doublons
      userRepository.deleteAll();

      String defaultPassword = passwordEncoder.encode("123");

      // 1. Lea
      User lea = new User();
      lea.setEmail("lea@mail.com");
      lea.setTag("Lynx");
      lea.setSpecialty("tacticien");
      lea.setCreationDate(LocalDate.parse("2025-11-12"));
      lea.setAdmin(false);
      lea.setPassword(defaultPassword);
      lea.setProfileImageUrl("flash.jpg");

      // 2. Tom
      User tom = new User();
      tom.setEmail("tom@mail.com");
      tom.setTag("Rogue");
      tom.setSpecialty("exécuteur");
      tom.setCreationDate(LocalDate.parse("2025-12-03"));
      tom.setAdmin(false);
      tom.setPassword(defaultPassword);
      tom.setProfileImageUrl("miles.jpg");

      // 3. Ines
      User ines = new User();
      ines.setEmail("ines@mail.com");
      ines.setTag("Pulse");
      ines.setSpecialty("guérisseur");
      ines.setCreationDate(LocalDate.parse("2026-01-18"));
      ines.setAdmin(true);
      ines.setPassword(defaultPassword);
      ines.setProfileImageUrl("Pessi.jpg");

      // 4. Tibo
      User tibo = new User();
      tibo.setEmail("tibo@mail.com");
      tibo.setTag("Iron");
      tibo.setSpecialty("gardien");
      tibo.setCreationDate(LocalDate.parse("2025-10-27"));
      tibo.setAdmin(true);
      tibo.setPassword(defaultPassword);
      tibo.setProfileImageUrl("luffy.png");

      // Sauvegarde des données
      userRepository.saveAll(List.of(lea, tom, ines, tibo));

      System.out.println("✅ Base de données initialisée !");
    };
  }
}