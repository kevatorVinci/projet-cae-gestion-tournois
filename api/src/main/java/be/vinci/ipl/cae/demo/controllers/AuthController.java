package be.vinci.ipl.cae.demo.controllers; // C'est le dossier de nos guichets d'accueil

import be.vinci.ipl.cae.demo.models.User;
import be.vinci.ipl.cae.demo.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController // On dit à Spring Boot que ce fichier est un guichet qui discute avec le site web
@RequestMapping("/auth") // L'adresse de base de ce guichet sera "/auth"
public class AuthController {

    // On appelle notre cerveau (le UserService) pour faire le travail
    private final UserService userService;

    /**
     * C'est le constructeur. Il permet de relier le guichet au cerveau.
     *
     * @param userService "Le cerveau qui sait comment inscrire un membre dans la base de données"
     */
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Cette méthode écoute le site web quand il envoie les données d'un nouveau formulaire d'inscription.
     * On utilise @PostMapping car le site web nous "poste" (envoie) de nouvelles informations.
     *
     * @param user "Le nouveau membre avec les infos tapées par l'utilisateur (email, mot de passe, tag...)"
     * @return "Le profil du membre créé, ou une erreur si quelque chose ne va pas"
     */
    @PostMapping("/register") // L'adresse exacte sera "/auth/register"
    public User register(@RequestBody User user) {

        // 1. On vérifie que les informations obligatoires ne sont pas vides
        if (user.getEmail() == null || user.getPassword() == null || user.getTag() == null || user.getSpecialty() == null) {
            // Si un champ manque, on renvoie une erreur 400 (Bad Request = Mauvaise requête)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }

        // 2. On demande au cerveau d'inscrire le membre
        User createdUser = userService.register(user);

        // 3. Si le cerveau renvoie null, ça veut dire que l'email existe déjà dans l'armoire
        if (createdUser == null) {
            // L'énoncé demande de gérer l'affichage des erreurs d'inscription.
            // On renvoie donc une erreur 409 (Conflict = Conflit) pour dire "Email déjà pris".
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }

        // 4. Tout s'est bien passé ! On renvoie les infos du membre créé.
        // L'énoncé précise : "Pas d'authentification automatique, redirection vers 'Se connecter' après création de compte".
        // Le site web recevra cette réponse et s'occupera de changer de page.
        return createdUser;
    }
}