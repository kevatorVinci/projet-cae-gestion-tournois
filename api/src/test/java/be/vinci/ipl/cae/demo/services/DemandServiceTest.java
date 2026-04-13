package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandRepository;
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
class DemandServiceTest {

  @Mock
  private DemandRepository demandRepo;
  @Mock
  private UserRepository userRepo;
  @Mock
  private TeamRepository teamRepo;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private DemandService demandService;

  private User member;
  private User responsible;
  private Team team;
  private Demand demand;

  @BeforeEach
  void setUp() {
    responsible = new User();
    responsible.setId(1L);

    member = new User();
    member.setId(2L);
    member.setTeam(null);

    team = new Team();
    team.setId(10L);
    team.setName("Les Invincibles");
    team.setPrimaryResponsible(responsible);
    team.setMembers(new ArrayList<>(List.of(responsible)));

    demand = new Demand();
    demand.setId(100L);
    demand.setMember(member);
    demand.setTeam(team);
    demand.setState(DemandState.PENDING);
  }

  @Test
  void createJoinRequest_memberWithoutTeam_OK() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));
    when(demandRepo.save(any())).thenReturn(demand);

    Demand result = demandService.createJoinRequest(2L, 10L);

    assertNotNull(result);
    assertEquals(DemandState.PENDING, result.getState());
    verify(demandRepo).save(any());
  }

  @Test
  void createJoinRequest_memberAlreadyInTeam_throwsRuntime() {
    member.setTeam(team);
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 10L));
    verify(demandRepo, never()).save(any());
  }

  @Test
  void createJoinRequest_nonExistentMember_throwsRuntime() {
    when(userRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(99L, 10L));
  }

  @Test
  void createJoinRequest_nonExistentTeam_throwsRuntime() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 99L));
  }

  @Test
  void createJoinRequest_teamWithoutResponsible_throwsRuntime() {
    team.setPrimaryResponsible(null);
    team.setSecondaryResponsible(null);

    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 10L));
    verify(demandRepo, never()).save(any());
  }

  @Test
  void getPendingRequestsForTeam_returnsList() {
    when(demandRepo.findByTeamIdAndState(10L, DemandState.PENDING))
            .thenReturn(List.of(demand));

    Iterable<Demand> result = demandService.getPendingRequestsForTeam(10L);

    assertTrue(result.iterator().hasNext());
  }

  @Test
  void getPendingRequestsForTeam_noDemands_returnsEmpty() {
    when(demandRepo.findByTeamIdAndState(10L, DemandState.PENDING)).thenReturn(List.of());

    Iterable<Demand> result = demandService.getPendingRequestsForTeam(10L);

    assertFalse(result.iterator().hasNext());
  }

  @Test
  void acceptDemand_byResponsible_OK() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(userRepo.save(any())).thenReturn(member);
    when(teamRepo.save(any())).thenReturn(team);
    when(demandRepo.save(any())).thenReturn(demand);

    Demand result = demandService.acceptDemand(100L, responsible);

    assertEquals(DemandState.ACCEPTED, result.getState());
    assertNotNull(result.getProcessingDate());
    assertEquals(team, member.getTeam());
    assertTrue(team.getMembers().contains(member));
  }

  @Test
  void acceptDemand_memberAddedToTeam() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(userRepo.save(any())).thenReturn(member);
    when(teamRepo.save(any())).thenReturn(team);
    when(demandRepo.save(any())).thenReturn(demand);

    demandService.acceptDemand(100L, responsible);

    verify(userRepo).save(member);
    verify(teamRepo).save(team);
  }

  @Test
  void acceptDemand_nonExistentDemand_throwsRuntime() {
    when(demandRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.acceptDemand(999L, responsible));
  }

  @Test
  void acceptDemand_nonResponsibleUser_throwsSecurity() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));

    assertThrows(SecurityException.class, () -> demandService.acceptDemand(100L, member));
  }

  @Test
  void acceptDemand_secondaryResponsible_OK() {
    User secondaryResp = new User();
    secondaryResp.setId(3L);
    team.setSecondaryResponsible(secondaryResp);

    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(userRepo.save(any())).thenReturn(member);
    when(teamRepo.save(any())).thenReturn(team);
    when(demandRepo.save(any())).thenReturn(demand);

    assertDoesNotThrow(() -> demandService.acceptDemand(100L, secondaryResp));
  }

  @Test
  void rejectDemand_withReason_OK() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    Demand result = demandService.rejectDemand(100L, "Insufficient level", responsible);

    assertEquals(DemandState.REJECTED, result.getState());
    assertEquals("Insufficient level", result.getRejectionReason());
    assertNotNull(result.getProcessingDate());
  }

  @Test
  void rejectDemand_secondaryResponsible_OK() {
    User secondaryResp = new User();
    secondaryResp.setId(3L);
    team.setSecondaryResponsible(secondaryResp);

    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    assertDoesNotThrow(
            () -> demandService.rejectDemand(100L, "Lack of experience", secondaryResp));
  }

  @Test
  void rejectDemand_nonResponsibleUser_throwsSecurity() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));

    assertThrows(
            SecurityException.class, () -> demandService.rejectDemand(100L, "reason", member));
  }

  @Test
  void rejectDemand_nonExistentDemand_throwsRuntime() {
    when(demandRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(
            RuntimeException.class, () -> demandService.rejectDemand(999L, "reason", responsible));
  }

  @Test
  void rejectDemand_memberDoesNotJoinTeam() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    demandService.rejectDemand(100L, "Reason", responsible);

    assertNull(member.getTeam());
    verify(userRepo, never()).save(any());
    verify(teamRepo, never()).save(any());
  }
}