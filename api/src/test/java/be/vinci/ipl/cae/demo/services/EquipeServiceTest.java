package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EquipeServiceTest {

  @Mock
  private TeamRepository teamRepo;
  @Mock
  private UserRepository userRepo;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private TeamService teamService;

  private User responsible;
  private User member;
  private Team team;

  @BeforeEach
  void setUp() {
    responsible = new User();
    responsible.setId(1L);

    member = new User();
    member.setId(2L);

    team = new Team();
    team.setId(10L);
    team.setName("Team Rockets");
    team.setPrimaryResponsible(responsible);
    team.setMembers(new ArrayList<>(List.of(responsible, member)));

    responsible.setTeam(team);
    member.setTeam(team);
  }

  @Test
  void getAllTeams_returnsList() {
    when(teamRepo.findAll()).thenReturn(List.of(team));
    Iterable<Team> result = teamService.getAllTeams();
    assertTrue(result.iterator().hasNext());
  }

  @Test
  void getTeamById_found_returnsTeam() {
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));
    Optional<Team> result = teamService.getTeamById(10L);
    assertTrue(result.isPresent());
    assertEquals("Team Rockets", result.get().getName());
  }

  @Test
  void createTeam_OK() {
    User freeUser = new User();
    freeUser.setId(3L);
    freeUser.setTeam(null);

    when(teamRepo.findByName("NewTeam")).thenReturn(Optional.empty());
    when(teamRepo.save(any())).thenReturn(new Team());

    Team result = teamService.createTeam(freeUser, "NewTeam", "img.png");
    assertNotNull(result);
    verify(notificationService).notifyTeamCreation(any(), any());
  }

  @Test
  void isUserResponsible_True() {
    assertTrue(teamService.isUserResponsible(team, responsible));
  }

  @Test
  void isUserResponsible_False() {
    User other = new User();
    other.setId(99L);
    assertFalse(teamService.isUserResponsible(team, other));
  }

  @Test
  void updateTeamImage_OK() {
    teamService.updateTeamImage(10L, "new_logo.jpg", responsible);
    assertEquals("new_logo.jpg", team.getProfileImage());
    verify(teamRepo).save(team);
  }
}