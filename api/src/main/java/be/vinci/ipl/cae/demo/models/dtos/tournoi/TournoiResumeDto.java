package be.vinci.ipl.cae.demo.models.dtos.tournoi;

import java.time.LocalDate;

/** Compact tournament view for registration-related responses. */
public record TournoiResumeDto(
    Long id,
    String nom,
    String etat,
    LocalDate dateDebut,
    Integer nombresParticipantsMax) {}
