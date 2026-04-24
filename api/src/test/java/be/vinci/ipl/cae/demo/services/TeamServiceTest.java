package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
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

/** Unit tests for TeamService using Mockito. */
@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

  @Mock private TeamRepository teamRepository;

  @Mock private UserRepository userRepository;

  @Mock private DemandService demandService;

  @Mock private NotificationService notificationService;

  @Mock private PlayerSelectionCleanupService playerSelectionCleanupService;

  @InjectMocks private TeamService teamService;

  private User currentUser;
  private User member;
  private Team team;

  @BeforeEach
  void setUp() {
    currentUser = new User();
    currentUser.setId(1L);
    currentUser.setTag("Captain");

    member = new User();
    member.setId(2L);
    member.setTag("Member");

    team = new Team();
    team.setId(10L);
    team.setName("Les Invincibles");
    team.setMembers(new ArrayList<>(List.of(currentUser, member)));
    team.setPrimaryResponsible(currentUser);

    currentUser.setTeam(team);
    member.setTeam(team);
  }

  @Test
  void kickMemberRemovesRegularMember() {
    when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
    when(teamRepository.save(team)).thenReturn(team);
    when(userRepository.save(member)).thenReturn(member);

    assertDoesNotThrow(() -> teamService.kickMember(currentUser, 2L));

    assertNull(member.getTeam());
    verify(userRepository).save(member);
    verify(teamRepository).save(team);
  }

  @Test
  void kickMemberRemovesResponsibleMemberWhenPossible() {
    User secondaryResponsible = new User();
    secondaryResponsible.setId(3L);
    secondaryResponsible.setTag("Second");
    secondaryResponsible.setTeam(team);

    team.getMembers().add(secondaryResponsible);
    team.setSecondaryResponsible(secondaryResponsible);

    when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
    when(userRepository.save(secondaryResponsible)).thenReturn(secondaryResponsible);
    when(teamRepository.save(team)).thenReturn(team);

    assertDoesNotThrow(() -> teamService.kickMember(currentUser, 3L));

    assertNull(secondaryResponsible.getTeam());
    verify(userRepository).save(secondaryResponsible);
    verify(teamRepository).save(team);
  }

  @Test
  void kickMemberNonResponsibleThrows() {
    User outsider = new User();
    outsider.setId(99L);
    outsider.setTag("Outsider");
    outsider.setTeam(team);

    team.setPrimaryResponsible(outsider);
    currentUser.setTeam(team);

    when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));

    assertThrows(IllegalStateException.class, () -> teamService.kickMember(currentUser, 2L));

    verify(userRepository, never()).save(member);
    verify(teamRepository, never()).save(team);
  }
}
