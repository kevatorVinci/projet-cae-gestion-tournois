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

/** REST controller for managing join demands. */
@RestController
@RequestMapping("/demands")
public class DemandController {

  private final DemandService demandService;
  private final DemandMapper demandMapper;

  public DemandController(DemandService demandService, DemandMapper demandMapper) {
    this.demandService = demandService;
    this.demandMapper = demandMapper;
  }

  @GetMapping("/me/en-attente")
  @IsResponsable
  public Iterable<DemandDto> readPendingDemands(@AuthenticationPrincipal User currentUser) {
    try {
      return demandMapper.toDtos(demandService.getPendingRequestsForResponsible(currentUser));
    } catch (RuntimeException e) {
      handleDemandException(e);
      return List.of();
    }
  }

  private void handleDemandException(RuntimeException e) {
    if (e instanceof SecurityException) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    }
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
  }

  @PostMapping("/{demandId}/accepter")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @IsResponsable
  public void acceptDemand(
          @PathVariable Long demandId, @AuthenticationPrincipal User currentUser) {
    try {
      demandService.acceptDemand(demandId, currentUser);
    } catch (RuntimeException e) {
      handleDemandException(e);
    }
  }

  @PostMapping("/{demandId}/refuser")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @IsResponsable
  public void rejectDemand(
          @PathVariable Long demandId,
          @RequestBody(required = false) Map<String, String> body,
          @AuthenticationPrincipal User currentUser) {
    try {
      String rejectionReason = (body != null) ? body.get("rejectionReason") : null;
      demandService.rejectDemand(demandId, rejectionReason, currentUser);
    } catch (RuntimeException e) {
      handleDemandException(e);
    }
  }
}