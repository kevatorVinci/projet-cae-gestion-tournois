package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TeamService using Mockito.
 */
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
  private Team team;

  /**
   * Set up mock data before each test.
   */
  @BeforeEach
  void setUp() {
    responsible = new User();
    responsible.setId(1L);
    responsible.setTag("Alice");

    team = new Team();
    team.setId(10L);
    team.setName("Test Team");
    team.setPrimaryResponsible(responsible);
    team.setMembers(new ArrayList<>(List.of(responsible)));

    responsible.setTeam(team);
  }

  /**
   * Tests successful team creation.
   */
  @Test
  void createTeamOk() {
    User freeUser = new User();
    freeUser.setId(3L);
    freeUser.setTeam(null);

    lenient().when(userRepo.findById(3L)).thenReturn(Optional.of(freeUser));
    lenient().when(teamRepo.findByName("NewTeam")).thenReturn(Optional.empty());
    lenient().when(teamRepo.save(any(Team.class))).thenReturn(team);
    lenient().when(userRepo.save(any(User.class))).thenReturn(freeUser);

    Team result = teamService.createTeam(freeUser, "NewTeam", "img.png");
    assertNotNull(result);
  }

  /**
   * Tests that the team profile image can be updated by the responsible.
   */
  @Test
  void updateTeamImageOk() {
    when(userRepo.findById(1L)).thenReturn(Optional.of(responsible));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    teamService.updateTeamImage(10L, "new_logo.jpg", responsible);

    assertEquals("new_logo.jpg", team.getProfileImage());
    verify(teamRepo).save(team);
  }
}