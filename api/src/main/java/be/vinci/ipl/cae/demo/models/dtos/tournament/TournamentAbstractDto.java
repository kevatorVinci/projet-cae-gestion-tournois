package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;

public record TournamentAbstractDto(
  Long id,
  String name,
  String status,
  LocalDate startDate,
  Integer maxParticipants) {
}