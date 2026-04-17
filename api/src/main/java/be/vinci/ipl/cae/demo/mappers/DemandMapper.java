package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.demand.DemandDto;
import be.vinci.ipl.cae.demo.models.entities.Demand;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Mapper component to convert Demand entities into Data Transfer Objects.
 */
@Component
public class DemandMapper {

  /**
   * Converts a Demand entity to its DTO representation.
   *
   * @param demand the entity to convert.
   * @return the corresponding DTO, or null if input is null.
   */
  public DemandDto toDto(Demand demand) {
    if (demand == null) {
      return null;
    }

    return new DemandDto(
      demand.getId(),
      demand.getMember().getId(),
      demand.getMember().getEmail(),
      demand.getMember().getTag(),
      demand.getMember().getSpecialty(),
      demand.getMember().getProfileImageUrl(),
      demand.getTeam().getId(),
      demand.getTeam().getName(),
      demand.getState(),
      demand.getRequestDate(),
      demand.getProcessingDate(),
      demand.getRejectionReason());
  }

  /**
   * Converts a list of Demand entities to a list of DTOs.
   *
   * @param demands an iterable collection of demand entities.
   * @return a list of demand DTOs.
   */
  public List<DemandDto> toDtos(Iterable<Demand> demands) {
    List<DemandDto> result = new ArrayList<>();
    if (demands != null) {
      for (Demand demand : demands) {
        result.add(toDto(demand));
      }
    }
    return result;
  }
}