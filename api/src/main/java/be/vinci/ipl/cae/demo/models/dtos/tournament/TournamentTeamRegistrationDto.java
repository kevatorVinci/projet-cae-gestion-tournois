package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;

/**
 * Public-facing registration DTO for tournament detail page.
 */
public record TournamentTeamRegistrationDto(
  Long teamId,
  String teamName,
  String teamProfileImage,
  LocalDate registrationDate) {
}