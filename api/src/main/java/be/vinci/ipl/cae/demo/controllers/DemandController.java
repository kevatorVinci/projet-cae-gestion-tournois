package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsResponsable;
import be.vinci.ipl.cae.demo.mappers.DemandMapper;
import be.vinci.ipl.cae.demo.models.dtos.demand.DemandDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.DemandService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
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
public class DemandController {

  private final DemandService demandeService;
  private final DemandMapper demandeMapper;

  /**
   * Constructor for DemandeController.
   *
   * @param demandeService the injected service.
   */
  public DemandController(DemandService demandeService, DemandMapper demandeMapper) {
    this.demandeService = demandeService;
    this.demandeMapper = demandeMapper;
  }

  /** List pending demands for the current responsible user's team. */
  @GetMapping("/me/en-attente")
  @IsResponsable
  public Iterable<DemandDto> readDemandesEnAttente(@AuthenticationPrincipal User currentUser) {
    try {
      return demandeMapper.toDtos(demandeService.getDemandesEnAttentePourResponsable(currentUser));
    } catch (RuntimeException e) {
      handleDemandeException(e);
      return List.of(); // unreachable, but required by the compiler
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
  @ResponseStatus(HttpStatus.NO_CONTENT) // no User serialization needed
  @IsResponsable
  public void accepterDemande(
      @PathVariable Long demandeId, @AuthenticationPrincipal User currentUser) {
    try {
      demandeService.accepterDemande(demandeId, currentUser);
    } catch (RuntimeException e) {
      handleDemandeException(e);
    }
  }

  /** Reject a join demand (equipe responsible only). */
  @PostMapping("/{demandeId}/refuser")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @IsResponsable
  public void refuserDemande(
      @PathVariable Long demandeId,
      @RequestBody(required = false) Map<String, String> body,
      @AuthenticationPrincipal User currentUser) {
    try {
      String raisonRefus = (body != null) ? body.get("raisonRefus") : null;
      demandeService.rejectDemand(demandeId, raisonRefus, currentUser);
    } catch (RuntimeException e) {
      handleDemandeException(e);
    }
  }
}
