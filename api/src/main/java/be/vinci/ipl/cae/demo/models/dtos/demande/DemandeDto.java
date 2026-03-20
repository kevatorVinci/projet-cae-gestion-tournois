package be.vinci.ipl.cae.demo.models.dtos.demande;

import be.vinci.ipl.cae.demo.models.entities.Demande.EtatDemande;
import java.time.LocalDateTime;

/** DTO for join demand information. */
public record DemandeDto(
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
