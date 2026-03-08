package be.vinci.ipl.cae.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**

 C'est la classe principale de l'application.

 C'est elle qui demarre tout le moteur Spring Boot !
 */
@SuppressWarnings("PMD.UseUtilityClass") // "Cette ligne empeche un outil de verification de se plaindre pour rien"
@SpringBootApplication // "Ce mot magique active toutes les fonctionnalites de Spring Boot automatiquement"
public class DemoApplication {

    public static void main(String[] args) {
// "On demande a Spring de lancer notre application avec cette classe comme point de depart"
        SpringApplication.run(DemoApplication.class, args);
    }
}