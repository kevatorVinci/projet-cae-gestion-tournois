package be.vinci.ipl.cae.demo.models.dtos.tournoi;

import java.time.LocalDate;

/** Public-facing registration DTO for tournament detail page. */
public record TournoiEquipeInscriptionDto(
    Long equipeId,
    String equipeName,
    LocalDate dateInscription) {}
