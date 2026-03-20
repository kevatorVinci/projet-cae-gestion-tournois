package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Indisponibilite;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.IndisponibiliteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Contrôleur pour gérer les appels liés aux indisponibilités. */
@RestController
@RequestMapping("/indisponibilites")
public class IndisponibiliteController {

  private final IndisponibiliteRepository indisponibiliteRepository;

  /**
   * Constructeur du contrôleur.
   *
   * @param indisponibiliteRepository le dépôt des indisponibilités
   */
  public IndisponibiliteController(IndisponibiliteRepository indisponibiliteRepository) {
    this.indisponibiliteRepository = indisponibiliteRepository;
  }

  /**
   * Récupère la liste des indisponibilités du joueur connecté.
   *
   * @param currentUser le joueur connecté
   * @return la liste des périodes
   */
  @GetMapping
  public Iterable<Indisponibilite> getMesIndisponibilites(
      @AuthenticationPrincipal User currentUser) {
    ensureAuthenticated(currentUser);
    return indisponibiliteRepository.findByUser(currentUser);
  }

  /**
   * Enregistre une nouvelle période d'indisponibilité.
   *
   * @param currentUser le joueur connecté
   * @param indisponibilite la nouvelle période envoyée par React
   * @return la période sauvegardée
   */
  @PostMapping
  public Indisponibilite addIndisponibilite(
      @AuthenticationPrincipal User currentUser, @RequestBody Indisponibilite indisponibilite) {
    ensureAuthenticated(currentUser);
    indisponibilite.setUser(currentUser);

    return indisponibiliteRepository.save(indisponibilite);
  }

  /**
   * Supprime une période d'indisponibilité grâce à son ID.
   *
   * @param id l'identifiant de la période
   * @param currentUser le joueur connecté
   */
  @DeleteMapping("/{id}")
  public void deleteIndisponibilite(
      @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
    ensureAuthenticated(currentUser);

    Indisponibilite indisponibilite =
        indisponibiliteRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Indisponibilite introuvable"));

    if (!indisponibilite.getUser().getId().equals(currentUser.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres indisponibilites.");
    }

    indisponibiliteRepository.delete(indisponibilite);
  }

  private void ensureAuthenticated(User currentUser) {
    if (currentUser == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie");
    }
  }
}
