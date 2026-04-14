package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Configuration;

/**
 * Component to initialize the database with demo data.
 */
@Configuration
public class DataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    // 1. On définit le mot de passe pour la démo
    final String pwd = pwdEncoder.encode("Azerty2026!");

    // 2. On vérifie si la DB est déjà remplie (méthode partagée du parent)
    // Si prepareBaseSeed retourne false, on arrête tout.
    if (!prepareBaseSeed(pwd)) {
      return;
    }

    seedBaseData(pwd);

    System.out.println("Base de données initialisée avec succès !");
  }
}