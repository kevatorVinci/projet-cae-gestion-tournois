package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.member.MemberPublicDto;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamPublicDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.TeamService;
import java.util.List;
import org.springframework.stereotype.Component;

/** Mapper for equipe-related DTO conversions. */
@Component
public class TeamMapper {

  private final TeamService equipeService;

  /** Builds the mapper with required service helpers. */
  public TeamMapper(TeamService equipeService) {
    this.equipeService = equipeService;
  }

  /** Converts one equipe to the API public payload. */
  public TeamPublicDto toPublicDto(Team equipe, User currentUser) {
    // Returns null if the team doesn't exist
    if (equipe == null) {
      return null;
    }

    // Transforms the list of User entities into MembrePublicDto objects
    List<MemberPublicDto> membres = equipe.getMembres().stream()
        .map(
            m -> new MemberPublicDto(
                m.getId(),
                m.getTag(),
                m.getSpecialty(),
                m.getProfileImageUrl(),
                equipeService.isUserResponsible(equipe, m)))
        .toList();

    // Checks if the current user is a leader of this team
    boolean isResponsable = currentUser != null
        && equipeService.isUserResponsible(equipe, currentUser);

    return new TeamPublicDto(
        equipe.getId(),
        equipe.getName(),
        equipe.getProfileImage(),
        membres,
        isResponsable);
  }
}