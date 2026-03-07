package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.services.EquipeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for public team (Equipe) operations.
 * <p>
 * Ce controller ne gère PAS la création ou l'adhésion à une équipe. Ces actions sont liées aux
 * membres et sont donc dans MembreController.
 */
@RestController
@RequestMapping("/equipes")
public class EquipeController {

  private final EquipeService equipeService;

  /**
   * Constructor for EquipeController.
   *
   * @param equipeService the injected service.
   */
  public EquipeController(EquipeService equipeService) {
    this.equipeService = equipeService;
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
}
