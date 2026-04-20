package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Demand;
import be.vinci.ipl.cae.demo.models.entities.Demand.DemandState;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DemandService using Mockito.
 */
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

  /**
   * Set up mock data before each test.
   */
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

  /**
   * Tests creating a join request when the member has no team.
   */
  @Test
  void createJoinRequestMemberWithoutTeamOk() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));
    when(demandRepo.save(any())).thenReturn(demand);

    Demand result = demandService.createJoinRequest(2L, 10L);

    assertNotNull(result);
    assertEquals(DemandState.PENDING, result.getState());
    verify(demandRepo).save(any());
  }

  /**
   * Tests that a member already in a team cannot create a request.
   */
  @Test
  void createJoinRequestMemberAlreadyInTeamThrowsRuntime() {
    member.setTeam(team);
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 10L));
    verify(demandRepo, never()).save(any());
  }

  /**
   * Tests creating a request for a non-existent member.
   */
  @Test
  void createJoinRequestNonExistentMemberThrowsRuntime() {
    when(userRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(99L, 10L));
  }

  /**
   * Tests creating a request for a non-existent team.
   */
  @Test
  void createJoinRequestNonExistentTeamThrowsRuntime() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 99L));
  }

  /**
   * Tests creating a request for a team without responsibles.
   */
  @Test
  void createJoinRequestTeamWithoutResponsibleThrowsRuntime() {
    team.setPrimaryResponsible(null);
    team.setSecondaryResponsible(null);

    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    assertThrows(RuntimeException.class, () -> demandService.createJoinRequest(2L, 10L));
    verify(demandRepo, never()).save(any());
  }

  /**
   * Tests that a join request is rejected when a member already has the same tag in team.
   */
  @Test
  void createJoinRequestDuplicateTagInTeamThrowsIllegalState() {
    member.setTag("Kevator");

    User existingMember = new User();
    existingMember.setId(50L);
    existingMember.setTag("kevator");
    team.getMembers().add(existingMember);

    when(userRepo.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepo.findById(10L)).thenReturn(Optional.of(team));

    IllegalStateException ex = assertThrows(
        IllegalStateException.class, () -> demandService.createJoinRequest(2L, 10L));

    assertEquals("Il y a déjà un Kevator dans cette équipe.", ex.getMessage());
    verify(demandRepo, never()).save(any());
  }

  /**
   * Tests retrieving pending requests for a team.
   */
  @Test
  void getPendingRequestsForTeamReturnsList() {
    when(demandRepo.findByTeamIdAndState(10L, DemandState.PENDING))
        .thenReturn(List.of(demand));

    Iterable<Demand> result = demandService.getPendingRequestsForTeam(10L);

    assertTrue(result.iterator().hasNext());
  }

  /**
   * Tests behavior when no pending requests exist for a team.
   */
  @Test
  void getPendingRequestsForTeamNoDemandsReturnsEmpty() {
    when(demandRepo.findByTeamIdAndState(10L, DemandState.PENDING)).thenReturn(List.of());

    Iterable<Demand> result = demandService.getPendingRequestsForTeam(10L);

    assertFalse(result.iterator().hasNext());
  }

  /**
   * Tests successful demand acceptance by a responsible user.
   */
  @Test
  void acceptDemandByResponsibleOk() {
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

  /**
   * Verifies that the member is correctly saved into the team upon acceptance.
   */
  @Test
  void acceptDemandMemberAddedToTeam() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(userRepo.save(any())).thenReturn(member);
    when(teamRepo.save(any())).thenReturn(team);
    when(demandRepo.save(any())).thenReturn(demand);

    demandService.acceptDemand(100L, responsible);

    verify(userRepo).save(member);
    verify(teamRepo).save(team);
  }

  /**
   * Tests accepting a non-existent demand.
   */
  @Test
  void acceptDemandNonExistentDemandThrowsRuntime() {
    when(demandRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandService.acceptDemand(999L, responsible));
  }

  /**
   * Tests that a non-responsible user cannot accept a demand.
   */
  @Test
  void acceptDemandNonResponsibleUserThrowsSecurity() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));

    assertThrows(SecurityException.class, () -> demandService.acceptDemand(100L, member));
  }

  /**
   * Tests that a secondary responsible can also accept a demand.
   */
  @Test
  void acceptDemandSecondaryResponsibleOk() {
    User secondaryResp = new User();
    secondaryResp.setId(3L);
    team.setSecondaryResponsible(secondaryResp);

    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(userRepo.save(any())).thenReturn(member);
    when(teamRepo.save(any())).thenReturn(team);
    when(demandRepo.save(any())).thenReturn(demand);

    assertDoesNotThrow(() -> demandService.acceptDemand(100L, secondaryResp));
  }

  /**
   * Tests that accepting a demand fails when a duplicate tag already exists in the team.
   */
  @Test
  void acceptDemandDuplicateTagInTeamThrowsIllegalState() {
    member.setTag("Kevator");
    User existingMember = new User();
    existingMember.setId(51L);
    existingMember.setTag("KEVATOR");
    team.getMembers().add(existingMember);

    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));

    IllegalStateException ex = assertThrows(
        IllegalStateException.class, () -> demandService.acceptDemand(100L, responsible));

    assertEquals("Il y a déjà un Kevator dans cette équipe.", ex.getMessage());
    verify(userRepo, never()).save(any());
    verify(teamRepo, never()).save(any());
    verify(demandRepo, never()).save(any());
  }

  /**
   * Tests successful demand rejection with a reason.
   */
  @Test
  void rejectDemandWithReasonOk() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    Demand result = demandService.rejectDemand(100L, "Insufficient level", responsible);

    assertEquals(DemandState.REJECTED, result.getState());
    assertEquals("Insufficient level", result.getRejectionReason());
    assertNotNull(result.getProcessingDate());
  }

  /**
   * Tests that a secondary responsible can reject a demand.
   */
  @Test
  void rejectDemandSecondaryResponsibleOk() {
    User secondaryResp = new User();
    secondaryResp.setId(3L);
    team.setSecondaryResponsible(secondaryResp);

    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    assertDoesNotThrow(
        () -> demandService.rejectDemand(100L, "Lack of experience", secondaryResp));
  }

  /**
   * Tests that a non-responsible user cannot reject a demand.
   */
  @Test
  void rejectDemandNonResponsibleUserThrowsSecurity() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));

    assertThrows(
        SecurityException.class, () -> demandService.rejectDemand(100L, "reason", member));
  }

  /**
   * Tests rejecting a non-existent demand.
   */
  @Test
  void rejectDemandNonExistentDemandThrowsRuntime() {
    when(demandRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(
        RuntimeException.class, () -> demandService.rejectDemand(999L, "reason", responsible));
  }

  /**
   * Verifies that a rejected member does not join the team.
   */
  @Test
  void rejectDemandMemberDoesNotJoinTeam() {
    when(demandRepo.findById(100L)).thenReturn(Optional.of(demand));
    when(demandRepo.save(any())).thenReturn(demand);

    demandService.rejectDemand(100L, "Reason", responsible);

    assertNull(member.getTeam());
    verify(userRepo, never()).save(any());
    verify(teamRepo, never()).save(any());
  }
}