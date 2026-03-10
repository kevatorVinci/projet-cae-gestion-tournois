package be.vinci.ipl.cae.demo.configuration; // ⚠️ Change ce package s'il n'est pas bon !

import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Si la base contient déjà des utilisateurs, on s'arrête pour ne pas faire de doublons
            userRepository.deleteAll();

            // On crypte le mot de passe "123" demandé pour la démo
            String defaultPassword = passwordEncoder.encode("123");

            // 1. Lea
            User lea = new User();
            lea.setEmail("lea@mail.com");
            lea.setTag("Lynx");
            lea.setSpecialty("tacticien");
            lea.setCreationDate(LocalDate.parse("2025-11-12"));
            lea.setAdmin(false);
            lea.setTeam("TEAM_ALPHA");
            lea.setPassword(defaultPassword);
            lea.setProfileImageUrl("flash.jpg");

            // 2. Tom
            User tom = new User();
            tom.setEmail("tom@mail.com");
            tom.setTag("Rogue");
            tom.setSpecialty("exécuteur");
            tom.setCreationDate(LocalDate.parse("2025-12-03"));
            tom.setAdmin(false);
            tom.setTeam("TEAM_ALPHA");
            tom.setPassword(defaultPassword);
            tom.setProfileImageUrl("miles.jpg");

            // 3. Ines
            User ines = new User();
            ines.setEmail("ines@mail.com");
            ines.setTag("Pulse");
            ines.setSpecialty("guérisseur");
            ines.setCreationDate(LocalDate.parse("2026-01-18"));
            ines.setAdmin(true);
            ines.setTeam("TEAM_ALPHA");
            ines.setPassword(defaultPassword);
            ines.setProfileImageUrl("Pessi.jpg");

            // 4. Tibo
            User tibo = new User();
            tibo.setEmail("tibo@mail.com");
            tibo.setTag("Iron");
            tibo.setSpecialty("gardien");
            tibo.setCreationDate(LocalDate.parse("2025-10-27"));
            tibo.setAdmin(true);
            tibo.setTeam("TEAM_OMEGA");
            tibo.setPassword(defaultPassword);
            tibo.setProfileImageUrl("luffy.png");

            // On sauvegarde toute la team d'un coup !
            userRepository.saveAll(List.of(lea, tom, ines, tibo));

            System.out.println("✅ Base de données initialisée avec les 4 joueurs de test !");
        };
    }
}