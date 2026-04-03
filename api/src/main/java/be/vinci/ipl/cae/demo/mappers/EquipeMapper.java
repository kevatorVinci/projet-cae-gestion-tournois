package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipePublicDto;
import be.vinci.ipl.cae.demo.models.dtos.membre.MembrePublicDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for equipe-related DTO conversions. */
@Component
public class EquipeMapper {

  private final EquipeService equipeService;

  /** Builds the mapper with required service helpers. */
  public EquipeMapper(EquipeService equipeService) {
    this.equipeService = equipeService;
  }

  /** Converts one equipe to the API public payload. */
  public EquipePublicDto toPublicDto(Equipe equipe, User currentUser) {
    // Returns null if the team doesn't exist
    if (equipe == null) {
      return null;
    }

    // Transforms the list of User entities into MembrePublicDto objects
    List<MembrePublicDto> membres =
            equipe.getMembres().stream()
                    .map(
                            m ->
                                    new MembrePublicDto(
                                            m.getId(),
                                            m.getTag(),
                                            m.getSpecialty(),
                                            m.getProfileImageUrl(),
                                            equipeService.isUserResponsible(equipe, m)))
                    .toList();

    // Checks if the current user is a leader of this team
    boolean isResponsable =
            currentUser != null && equipeService.isUserResponsible(equipe, currentUser);

    return new EquipePublicDto(equipe.getId(), equipe.getName(), equipe.getProfileImage(), membres, isResponsable);
  }
}