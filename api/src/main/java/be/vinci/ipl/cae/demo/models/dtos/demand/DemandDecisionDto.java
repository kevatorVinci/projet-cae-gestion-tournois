package be.vinci.ipl.cae.demo.models.dtos.demand;

/**
 * DTO for deciding a demand rejection reason.
 */
public record DemandDecisionDto(
    String rejectionReason,
    String raisonRefus) {
}
