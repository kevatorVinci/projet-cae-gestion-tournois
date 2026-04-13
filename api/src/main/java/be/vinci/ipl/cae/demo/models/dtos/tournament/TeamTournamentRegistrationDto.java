package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;

/**
 * Team registration DTO used by responsible/team-facing endpoints.
 */
public record TeamTournamentRegistrationDto(
  Long tournamentId,
  Long teamId,
  LocalDate registrationDate,
  TournamentAbstractDto tournament) {
}