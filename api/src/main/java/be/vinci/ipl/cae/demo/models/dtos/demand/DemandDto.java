package be.vinci.ipl.cae.demo.models.dtos.demand;

import be.vinci.ipl.cae.demo.models.entities.Demand.EtatDemande;
import java.time.LocalDateTime;

/** DTO for join demand information. */
public record DemandDto(
    Long idDemande,
    Long membreId,
    String membreEmail,
    String membreTag,
    String membreSpecialty,
    String membreProfileImageUrl,
    Long equipeId,
    String equipeName,
    EtatDemande etat,
    LocalDateTime dateDemande,
    LocalDateTime dateTraitement,
    String raisonRefus) {}
