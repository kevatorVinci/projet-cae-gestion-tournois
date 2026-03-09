package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeCreationDto;
import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipeJoinDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import be.vinci.ipl.cae.demo.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for public team (Equipe) operations.
 *
 * <p>Ce controller ne gère PAS la création ou l'adhésion à une équipe. Ces actions sont liées aux
 * membres et sont donc dans MembreController.
 */
@RestController
@RequestMapping("/equipes")
public class EquipeController {

  private final EquipeService equipeService;
  private final UserService userService;

  /**
   * Constructor for EquipeController.
   *
   * @param equipeService the injected service.
   * @param userService   the injected user service.
   */
  public EquipeController(EquipeService equipeService, UserService userService) {
    this.equipeService = equipeService;
    this.userService = userService;
  }

  /**
   * Récupérer toutes les équipes (version publique).
   */
  @GetMapping({"", "/"})
  public Iterable<Equipe> readAllEquipes() {
    return equipeService.getAllEquipes();
  }

  /**
   * Récupérer une équipe par son identifiant.
   */
  @GetMapping("/{id}")
  public Equipe readOneEquipe(@PathVariable Long id) {
    return equipeService.getEquipeById(id)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Équipe introuvable"
        ));
  }


  /**
   * Create a team for a given user id.
   *
   * @param userId user id
   * @param dto    creation payload
   * @return created team
   */
  @PostMapping("/{userId}/equipes")
  @ResponseStatus(HttpStatus.CREATED)
  public Equipe creerEquipe(
      @PathVariable Long userId,
      @RequestBody EquipeCreationDto dto
  ) {
    User user = userService.getById(userId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Utilisateur introuvable"));

    try {
      Equipe equipe = userService.creerEquipe(user, dto.name());
      if (equipe == null) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Nom d'equipe deja utilise");
      }
      return equipe;
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  /**
   * Join an existing team for a given user id.
   *
   * @param userId user id
   * @param dto    join payload
   */
  @PostMapping("/{userId}/equipes/rejoindre")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void rejoindreEquipe(
      @PathVariable Long userId,
      @RequestBody EquipeJoinDto dto
  ) {
    User user = userService.getById(userId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Utilisateur introuvable"));

    try {
      userService.demanderRejoindreEquipe(user, dto.equipeId());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }
}
