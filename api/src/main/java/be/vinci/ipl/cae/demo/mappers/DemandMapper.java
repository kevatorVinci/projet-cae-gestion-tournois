package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.demand.DemandDto;
import be.vinci.ipl.cae.demo.models.entities.Demand;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for join-request DTO conversions. */
@Component
public class DemandMapper {

  /** Converts one join-request entity to its public DTO. */
  public DemandDto toDto(Demand demande) {
    if (demande == null) {
      return null;
    }

    return new DemandDto(
        demande.getIdDemande(),
        demande.getMembre().getId(),
        demande.getMembre().getEmail(),
        demande.getMembre().getTag(),
        demande.getMembre().getSpecialty(),
        demande.getMembre().getProfileImageUrl(),
        demande.getEquipe().getId(),
        demande.getEquipe().getName(),
        demande.getEtat(),
        demande.getDateDemande(),
        demande.getDateTraitement(),
        demande.getRaisonRefus());
  }

  /** Converts a collection of join requests into DTOs. */
  public List<DemandDto> toDtos(Iterable<Demand> demandes) {
    List<DemandDto> result = new ArrayList<>();
    for (Demand demande : demandes) {
      result.add(toDto(demande));
    }
    return result;
  }
}
