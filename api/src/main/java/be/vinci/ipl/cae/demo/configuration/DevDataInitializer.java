package be.vinci.ipl.cae.demo.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a dataset for the development environment.
 * Activated only when the "dev" Spring profile is active.
 */
@Component
@Profile("dev")
public class DevDataInitializer extends AbstractDataInitializer {

  @Override
  public void run(String... args) {
    // 1. On définit le mot de passe pour la démo
    final String pwd = pwdEncoder.encode("Azerty2026!");

    // 2. On vérifie si la DB est déjà remplie (méthode partagée du parent)
    // Si prepareBaseSeed retourne false, on arrête tout.
    if (!prepareBaseSeed(pwd)) {
      return;
    }

    // 3. On appelle la méthode géante du parent qui crée TOUT (Users, Teams, Tournois...)
    seedBaseData(pwd);

    System.out.println("[dev] Base de données initialisée avec succès !");
  }
}