package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.TeamMapper;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamCreationDto;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamJoinDto;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamPublicDto;
import be.vinci.ipl.cae.demo.models.dtos.team.TeamUpdateDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.TeamService;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for public team operations.
 */
@RestController
@RequestMapping("/equipes")
public class TeamController {

  private final TeamService teamService;
  private final TeamMapper teamMapper;

  public TeamController(TeamService teamService, TeamMapper teamMapper) {
    this.teamService = teamService;
    this.teamMapper = teamMapper;
  }

  @GetMapping({ "", "/" })
  public Iterable<TeamPublicDto> readAllTeams(@AuthenticationPrincipal User currentUser) {
    List<TeamPublicDto> teams = new ArrayList<>();
    for (Team team : teamService.getAllTeams()) {
      teams.add(teamMapper.toPublicDto(team, currentUser));
    }
    return teams;
  }

  @GetMapping("/{id}")
  public TeamPublicDto readOneTeam(
          @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
    Team team = teamService.getTeamById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Team not found"));

    return teamMapper.toPublicDto(team, currentUser);
  }

  @PostMapping("/{userId}/equipes")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  public Team createTeam(
          @PathVariable Long userId,
          @RequestBody @Valid TeamCreationDto dto,
          @AuthenticationPrincipal User currentUser) {

    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "You can only create a team for your own account.");
    }

    try {
      Team team = teamService.createTeam(currentUser, dto.name(), dto.profileImage());
      if (team == null) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Team name already in use");
      }
      return team;
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  @PostMapping("/{userId}/equipes/rejoindre")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void joinTeam(
          @PathVariable Long userId,
          @RequestBody @Valid TeamJoinDto dto,
          @AuthenticationPrincipal User currentUser) {
    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "You can only join a team for your own account.");
    }

    try {
      teamService.requestJoinTeam(currentUser, dto.teamId());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }

  @PostMapping("/{userId}/equipes/quitter")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void leaveTeam(
          @PathVariable Long userId,
          @RequestBody(required = false) Map<String, Long> body,
          @AuthenticationPrincipal User currentUser) {

    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "You can only leave the team for your own account.");
    }

    try {
      Long newResponsibleId = body == null ? null : body.get("newResponsibleId");
      teamService.leaveTeam(currentUser, newResponsibleId);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  @PostMapping("/{userId}/equipes/responsables/{membreId}/promouvoir")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void promoteResponsible(
          @PathVariable Long userId,
          @PathVariable("membreId") Long memberId,
          @AuthenticationPrincipal User currentUser) {
    ensureSelfTeamManagement(userId, currentUser);
    executeTeamAction(() -> teamService.promoteTeamMember(currentUser, memberId));
  }

  @PostMapping("/{userId}/equipes/responsables/{membreId}/depromouvoir")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void demoteResponsible(
          @PathVariable Long userId,
          @PathVariable("membreId") Long memberId,
          @AuthenticationPrincipal User currentUser) {
    ensureSelfTeamManagement(userId, currentUser);
    executeTeamAction(() -> teamService.demoteTeamLeader(currentUser, memberId));
  }

  @GetMapping("/me/isResponsable")
  @PreAuthorize("isAuthenticated()")
  public boolean isCurrentUserResponsible(@AuthenticationPrincipal User currentUser) {
    return teamService.isCurrentUserResponsible(currentUser);
  }

  @PutMapping("/{equipeId}/image")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void updateTeamImage(
          @PathVariable("equipeId") Long teamId,
          @RequestBody @Valid TeamUpdateDto dto,
          @AuthenticationPrincipal User currentUser) {

    try {
      teamService.updateTeamImage(teamId, dto.profileImage(), currentUser);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
    }
  }

  private void ensureSelfTeamManagement(Long userId, User currentUser) {
    if (currentUser == null || !userId.equals(currentUser.getId())) {
      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "You can only manage responsibles for your own account.");
    }
  }

  private void executeTeamAction(Runnable action) {
    try {
      action.run();
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }
}