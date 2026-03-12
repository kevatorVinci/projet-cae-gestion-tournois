package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Indisponibilite;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.IndisponibiliteRepository;
import be.vinci.ipl.cae.demo.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Contrôleur pour gérer les appels liés aux indisponibilités.
 */
@RestController
@RequestMapping("/indisponibilites")
public class IndisponibiliteController {

  private final IndisponibiliteRepository indisponibiliteRepository;
  private final UserService userService;

  /**
   * Constructeur du contrôleur.
   *
   * @param indisponibiliteRepository le dépôt des indisponibilités
   * @param userService le service des utilisateurs
   */
  public IndisponibiliteController(
          IndisponibiliteRepository indisponibiliteRepository, UserService userService) {
    this.indisponibiliteRepository = indisponibiliteRepository;
    this.userService = userService;
  }

  /**
   * Récupère la liste des indisponibilités du joueur connecté.
   *
   * @param auth les informations de connexion du joueur
   * @return la liste des périodes
   */
  @GetMapping
  public Iterable<Indisponibilite> getMesIndisponibilites(Authentication auth) {
    User user = userService.readOneFromEmail(auth.getName());
    return indisponibiliteRepository.findByUser(user);
  }

  /**
   * Enregistre une nouvelle période d'indisponibilité.
   *
   * @param auth les informations de connexion
   * @param indisponibilite la nouvelle période envoyée par React
   * @return la période sauvegardée
   */
  @PostMapping
  public Indisponibilite addIndisponibilite(
          Authentication auth, @RequestBody Indisponibilite indisponibilite) {

        System.out.println(">>> Requête reçue pour : " + auth.getName());
        System.out.println(
                        ">>> Dates : "
                                        + indisponibilite.getDateDebut()
                                        + " au "
                                        + indisponibilite.getDateFin());
        String email = auth.getName();

        User user = userService.readOneFromEmail(email);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non trouvé");
        }

        indisponibilite.setUser(user);

        return indisponibiliteRepository.save(indisponibilite);
  }

  /**
   * Supprime une période d'indisponibilité grâce à son ID.
   *
   * @param id l'identifiant de la période
   */
  @DeleteMapping("/{id}")
  public void deleteIndisponibilite(@PathVariable Long id) {
        indisponibiliteRepository.deleteById(id);
  }
}