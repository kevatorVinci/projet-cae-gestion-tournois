package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;

/** Compact tournament view for registration-related responses. */
public record TournamentAbstractDto(
    Long id,
    String nom,
    String etat,
    LocalDate dateDebut,
    Integer nombresParticipantsMax) {}
