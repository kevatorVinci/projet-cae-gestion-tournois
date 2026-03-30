package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.equipe.EquipePublicDto;
import be.vinci.ipl.cae.demo.models.dtos.membre.MembrePublicDto;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.EquipeService;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EquipeMapper {

  private final EquipeService equipeService;

  public EquipeMapper(EquipeService equipeService) {
    this.equipeService = equipeService;
  }

  public EquipePublicDto toPublicDto(Equipe equipe, User currentUser) {
    if (equipe == null) {
      return null;
    }

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

    boolean isResponsable = currentUser != null && equipeService.isUserResponsible(equipe, currentUser);
    return new EquipePublicDto(equipe.getId(), equipe.getName(), membres, isResponsable);
  }
}
