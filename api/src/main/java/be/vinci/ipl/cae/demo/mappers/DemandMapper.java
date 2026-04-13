package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.demand.DemandDto;
import be.vinci.ipl.cae.demo.models.entities.Demand;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DemandMapper {

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

  public List<DemandDto> toDtos(Iterable<Demand> demands) {
    List<DemandDto> result = new ArrayList<>();
    for (Demand demand : demands) {
      result.add(toDto(demand));
    }
    return result;
  }
}