package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.member.MemberPublicDto;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamPublicDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.TeamService;
import java.util.List;
import java.util.ArrayList;
import org.springframework.stereotype.Component;

/**
 * Mapper for team-related DTO conversions.
 */
@Component
public class TeamMapper {

  private final TeamService teamService;

  /**
   * Builds the mapper with required service helpers.
   *
   * @param teamService the team service helper.
   */
  public TeamMapper(TeamService teamService) {
    this.teamService = teamService;
  }

  /**
   * Converts one team to the API public payload.
   *
   * @param team        the team entity to convert.
   * @param currentUser the current user to check responsibilities.
   * @return the team public DTO.
   */
  public TeamPublicDto toPublicDto(Team team, User currentUser) {
    // Returns null if the team doesn't exist
    if (team == null) {
      return null;
    }

    // Transforms the list of User entities into MemberPublicDto objects
    List<MemberPublicDto> members = team.getMembers().stream()
        .map(m -> new MemberPublicDto(
            m.getId(),
            m.getTag(),
            m.getSpecialty(),
            m.getProfileImageUrl(),
            teamService.isUserResponsible(team, m)
        ))
        .toList();

    // Checks if the current user is a leader of this team
    boolean isResponsible = currentUser != null
        && teamService.isUserResponsible(team, currentUser);

    return new TeamPublicDto(
        team.getId(),
        team.getName(),
        team.getProfileImage(),
        members,
        isResponsible
    );
  }

  /**
   * Converts multiple teams to public DTOs.
   *
   * @param teams the teams to convert.
   * @param currentUser the authenticated user.
   * @return the list of mapped DTOs.
   */
  public List<TeamPublicDto> toPublicDtos(Iterable<Team> teams, User currentUser) {
    List<TeamPublicDto> result = new ArrayList<>();
    if (teams == null) {
      return result;
    }
    for (Team team : teams) {
      result.add(toPublicDto(team, currentUser));
    }
    return result;
  }
}