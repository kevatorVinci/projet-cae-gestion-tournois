package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
  private Team team;

  @BeforeEach
  void setUp() {
    responsible = new User();
    responsible.setId(1L);

    team = new Team();
    team.setId(10L);
    team.setName("Test Team");
    team.setPrimaryResponsible(responsible);
    team.setMembers(new ArrayList<>(List.of(responsible)));
  }

  @Test
  void createTeam_OK() {
    User freeUser = new User();
    freeUser.setId(3L);
    freeUser.setTeam(null);

    // On simule que l'utilisateur est trouvé en BD pour éviter le NullPointer
    when(userRepo.findById(3L)).thenReturn(Optional.of(freeUser));
    when(teamRepo.findByName("NewTeam")).thenReturn(Optional.empty());
    // On simule le retour de l'équipe sauvegardée
    when(teamRepo.save(any(Team.class))).thenReturn(team);

    Team result = teamService.createTeam(freeUser, "NewTeam", "img.png");
    assertNotNull(result);
  }

  @Test
  void updateTeamImage_OK() {
    // On simule que l'équipe existe en BD pour éviter le "Team not found"
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    teamService.updateTeamImage(10L, "new_logo.jpg", responsible);

    assertEquals("new_logo.jpg", team.getProfileImage());
    verify(teamRepo).save(team);
  }
}