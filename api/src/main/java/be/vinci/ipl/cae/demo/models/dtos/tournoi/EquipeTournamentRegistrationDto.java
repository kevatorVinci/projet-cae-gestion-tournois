package be.vinci.ipl.cae.demo.models.dtos.tournoi;

import java.time.LocalDate;

/** Team registration DTO used by responsible/team-facing endpoints. */
public record EquipeTournamentRegistrationDto(
    Long tournoiId,
    Long equipeId,
    LocalDate dateInscription,
    TournoiResumeDto tournoi) {}
