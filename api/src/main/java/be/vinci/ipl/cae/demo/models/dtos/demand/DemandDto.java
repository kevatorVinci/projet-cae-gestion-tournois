package be.vinci.ipl.cae.demo.models.dtos.demand;

import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;

import java.time.LocalDateTime;

public record DemandDto(
  Long id,
  Long memberId,
  String memberEmail,
  String memberTag,
  String memberSpecialty,
  String memberProfileImageUrl,
  Long teamId,
  String teamName,
  DemandState state,
  LocalDateTime requestDate,
  LocalDateTime processingDate,
  String rejectionReason) {
}