package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.equipedto.EquipeCreationDto;
import be.vinci.ipl.cae.demo.models.dtos.equipedto.EquipeJoinDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.Membre;
import be.vinci.ipl.cae.demo.services.MembreService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller gérant les actions des membres. - création d'une équipe - rejoindre une équipe.
 */
@RestController
@RequestMapping("/membres")
public class MembreController {

  private final MembreService membreService;

  public MembreController(MembreService membreService) {
    this.membreService = membreService;
  }

  /**
   * Un membre crée une équipe.
   */
  @PostMapping("/{membreId}/equipes")
  @ResponseStatus(HttpStatus.CREATED)
  public Equipe creerEquipe(
      @PathVariable Long membreId,
      @RequestBody EquipeCreationDto dto
  ) {
    Membre membre = membreService.getById(membreId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable"));

    try {
      return membreService.creerEquipe(membre, dto.name());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  /**
   * Un membre demande à rejoindre une équipe existante.
   */
  @PostMapping("/{membreId}/equipes/rejoindre")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void demanderRejoindreEquipe(
      @PathVariable Long membreId,
      @RequestBody EquipeJoinDto dto
  ) {
    Membre membre = membreService.getById(membreId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable"));

    try {
      membreService.demanderRejoindreEquipe(membre, dto.equipeId());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }
}
