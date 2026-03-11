package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.demande.DemandeDto;
import be.vinci.ipl.cae.demo.models.entities.Demande;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.DemandeService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** REST controller for managing join demands (Demande). */
@RestController
@RequestMapping("/demands")
public class DemandeController {

  private final DemandeService demandeService;

  /**
   * Constructor for DemandeController.
   *
   * @param demandeService the injected service.
   */
  public DemandeController(DemandeService demandeService) {
    this.demandeService = demandeService;
  }

  /** List pending demands for the current responsible user's team. */
  @GetMapping("/me/en-attente")
  @PreAuthorize("isAuthenticated()")
  public Iterable<DemandeDto> readDemandesEnAttente(@AuthenticationPrincipal User currentUser) {
    try {
      List<DemandeDto> demandes = new ArrayList<>();
      for (Demande demande : demandeService.getDemandesEnAttentePourResponsable(currentUser)) {
        demandes.add(
            new DemandeDto(
                demande.getIdDemande(),
                demande.getMembre().getId(),
                demande.getMembre().getEmail(),
              demande.getMembre().getTag(),
              demande.getMembre().getSpecialty(),
              demande.getMembre().getProfileImageUrl(),
                demande.getEquipe().getId(),
                demande.getEquipe().getName(),
                demande.getEtat(),
                demande.getDateDemande(),
                demande.getDateTraitement(),
                demande.getRaisonRefus()));
      }
      return demandes;
    } catch (RuntimeException e) {
      handleDemandeException(e);
      return List.of(); // jamais atteint mais requis par le compilateur
    }
  }

  /**
   * Handles common exceptions thrown by the service layer.
   *
   * @param e the exception to handle.
   */
  private void handleDemandeException(RuntimeException e) {
    if (e instanceof SecurityException) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    }
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
  }

  /** Accept a join demand (equipe responsible only). */
  @PostMapping("/{demandeId}/accepter")
  @ResponseStatus(HttpStatus.OK)
  @PreAuthorize("isAuthenticated()")
  public User accepterDemande(
      @PathVariable Long demandeId, @AuthenticationPrincipal User currentUser) {
    try {
      Demande demande = demandeService.accepterDemande(demandeId, currentUser);
      return demande.getMembre();
    } catch (RuntimeException e) {
      handleDemandeException(e);
      return null; // jamais atteint mais requis par le compilateur
    }
  }

  /** Reject a join demand (equipe responsible only). */
  @PostMapping("/{demandeId}/refuser")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void refuserDemande(
      @PathVariable Long demandeId,
      @RequestBody(required = false) Map<String, String> body,
      @AuthenticationPrincipal User currentUser) {
    try {
      String raisonRefus = (body != null) ? body.get("raisonRefus") : null;
      demandeService.refuserDemande(demandeId, raisonRefus, currentUser);
    } catch (RuntimeException e) {
      handleDemandeException(e);
    }
  }
}
