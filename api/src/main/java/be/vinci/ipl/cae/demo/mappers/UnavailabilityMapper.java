package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.unavailability.UnavailabilityResponseDto;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import org.springframework.stereotype.Component;

/**
 * Mapper for unavailability DTO conversions.
 */
@Component
public class UnavailabilityMapper {

  /**
   * Converts an entity to a response DTO.
   *
   * @param unavailability the entity to convert.
   * @return the corresponding DTO.
   */
  public UnavailabilityResponseDto toDto(Unavailability unavailability) {
    if (unavailability == null) {
      return null;
    }

    return new UnavailabilityResponseDto(
        unavailability.getId(),
        unavailability.getStartDate(),
        unavailability.getEndDate());
  }

  /**
   * Converts a create DTO to an entity.
   *
   * @param dto the creation payload.
   * @return the entity.
   */
  public Unavailability toEntity(UnavailabilityCreateDto dto) {
    Unavailability unavailability = new Unavailability();
    if (dto == null) {
      return unavailability;
    }

    unavailability.setStartDate(dto.startDate());
    unavailability.setEndDate(dto.endDate());
    return unavailability;
  }
}
