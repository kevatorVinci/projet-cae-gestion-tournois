package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

  @Bean
  public CommandLineRunner initDatabase(EquipeRepository equipeRepository,
                                        UserRepository userRepository,
                                        PasswordEncoder passwordEncoder) {
    return args -> {
      // Si on a déjà des utilisateurs, on ne fait rien pour ne pas créer de doublons
      if (userRepository.count() > 0) {
        return;
      }

      String defaultPassword = passwordEncoder.encode("123");

      // 1. Lea (Lynx) - Responsable TEAM_ALPHA
      User lea = new User();
      lea.setEmail("lea@mail.com");
      lea.setTag("Lynx");
      lea.setSpecialty("tacticien");
      lea.setCreationDate(LocalDate.parse("2025-11-12"));
      lea.setAdmin(false);
      lea.setPassword(defaultPassword);
      lea.setProfileImageUrl("flash.jpg");

      // 2. Tom (Rogue)
      User tom = new User();
      tom.setEmail("tom@mail.com");
      tom.setTag("Rogue");
      tom.setSpecialty("exécuteur");
      tom.setCreationDate(LocalDate.parse("2025-12-03"));
      tom.setAdmin(false);
      tom.setPassword(defaultPassword);
      tom.setProfileImageUrl("miles.jpg");

      // 3. Ines (Pulse) - Admin
      User ines = new User();
      ines.setEmail("ines@mail.com");
      ines.setTag("Pulse");
      ines.setSpecialty("guérisseur");
      ines.setCreationDate(LocalDate.parse("2026-01-18"));
      ines.setAdmin(true);
      ines.setPassword(defaultPassword);
      ines.setProfileImageUrl("Pessi.jpg");

      // 4. Tibo (Iron) - Admin & Responsable TEAM_OMEGA
      User tibo = new User();
      tibo.setEmail("tibo@mail.com");
      tibo.setTag("Iron");
      tibo.setSpecialty("gardien");
      tibo.setCreationDate(LocalDate.parse("2025-10-27"));
      tibo.setAdmin(true);
      tibo.setPassword(defaultPassword);
      tibo.setProfileImageUrl("luffy.png");

      userRepository.saveAll(List.of(lea, tom, ines, tibo));
      System.out.println("✅ Comptes de démo créés : lea, tom, ines, tibo !");
    };
  }
}