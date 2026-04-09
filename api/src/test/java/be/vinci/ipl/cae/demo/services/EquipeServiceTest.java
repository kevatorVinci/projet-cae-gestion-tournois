package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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

  @Mock private TeamRepository equipeRepository;
  @Mock private UserRepository userRepository;
  @Mock private DemandService demandService;
  @Mock private NotificationService notificationService;

  @InjectMocks private TeamService equipeService;

  private User responsable;
  private User membre;
  private User tiers;
  private Team equipe;

  /**
   * Sets up the initial data before each test.
   * Initializes users and a default team.
   */
  @BeforeEach
  void setUp() {
    responsable = new User();
    responsable.setId(1L);
    responsable.setTag("AlphaTag");

    membre = new User();
    membre.setId(2L);
    membre.setTag("BetaTag");

    tiers = new User();
    tiers.setId(3L);
    tiers.setTag("GammaTag");

    equipe = new Team();
    equipe.setId(10L);
    equipe.setName("Les Invincibles");
    equipe.setResponsablePrincipal(responsable);
    equipe.setMembres(new ArrayList<>(List.of(responsable, membre)));

    responsable.setEquipe(equipe);
    membre.setEquipe(equipe);

    lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(responsable));
    lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(membre));
    lenient().when(userRepository.findById(3L)).thenReturn(Optional.of(tiers));
  }

  // ═══════════════════════════════════════════════════════════════════
  // getAllEquipes
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests if the method correctly returns all teams.
   */
  @Test
  void getAllEquipes_returnsAllTeams() {
    when(equipeRepository.findAll()).thenReturn(List.of(equipe));

    Iterable<Team> result = equipeService.getAllEquipes();

    assertTrue(result.iterator().hasNext());
  }

  // ═══════════════════════════════════════════════════════════════════
  // getEquipeById
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests retrieving a team that exists by its ID.
   */
  @Test
  void getEquipeById_existingTeam_returnsTeam() {
    when(equipeRepository.findById(10L)).thenReturn(Optional.of(equipe));

    Optional<Team> result = equipeService.getEquipeById(10L);

    assertTrue(result.isPresent());
    assertEquals("Les Invincibles", result.get().getName());
  }

  /**
   * Tests retrieving a team that does not exist.
   */
  @Test
  void getEquipeById_nonExistingTeam_returnsEmpty() {
    when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

    assertTrue(equipeService.getEquipeById(99L).isEmpty());
  }

  // ═══════════════════════════════════════════════════════════════════
  // creerEquipe
  // Rule: the creator automatically becomes the primary responsible (Statement p.2)
  // Rule: two teams cannot have the same name (ClarificationsV2 p.2)
  // Rule: a member can only belong to 1 team (Statement p.3)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests if the creator correctly becomes the primary responsible when a team is created.
   */
  @Test
  void creerEquipe_creator_becomesPrimaryResponsible() {
    // Rule: when creating a team, the member automatically becomes the responsible (Statement p.2)
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);
    userSansEquipe.setEquipe(null);

    when(equipeRepository.existsByName("NewTeam")).thenReturn(false);
    when(userRepository.save(any())).thenReturn(userSansEquipe);
    when(equipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    // ✨ FIX: Added "default.jpg" as the third parameter
    Team result = equipeService.creerEquipe(userSansEquipe, "NewTeam", "default.jpg");

    assertNotNull(result);
    assertEquals("NewTeam", result.getName());
    assertEquals(userSansEquipe, result.getResponsablePrincipal());
    assertTrue(result.getMembres().contains(userSansEquipe));
  }

  /**
   * Tests team creation failure when the name is already taken.
   */
  @Test
  void creerEquipe_nameAlreadyExists_returnsNull() {
    // Rule: two teams cannot have the same name (ClarificationsV2 p.2)
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);
    userSansEquipe.setEquipe(null);

    when(equipeRepository.existsByName("Les Invincibles")).thenReturn(true);

    // ✨ FIX: Added "default.jpg" as the third parameter
    assertNull(equipeService.creerEquipe(userSansEquipe, "Les Invincibles", "default.jpg"));
    verify(equipeRepository, never()).save(any());
  }

  /**
   * Tests team creation failure when the member is already in a team.
   */
  @Test
  void creerEquipe_memberAlreadyInTeam_throwsIllegalState() {
    // Rule: a member can only belong to 1 team at a time (Statement p.3)
    // ✨ FIX: Added "default.jpg" as the third parameter
    assertThrows(
            IllegalStateException.class,
            () -> equipeService.creerEquipe(responsable, "NouvelleEquipe", "default.jpg"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // demanderRejoindreEquipe
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests if joining a team delegates the task to the DemandService.
   */
  @Test
  void demanderRejoindreEquipe_delegatesToDemandService() {
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);

    equipeService.demanderRejoindreEquipe(userSansEquipe, 10L);

    verify(demandService).creerDemande(5L, 10L);
  }

  // ═══════════════════════════════════════════════════════════════════
  // isUserResponsible
  // Rule: primary and secondary have the EXACT SAME rights (ClarificationsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests if the primary responsible is recognized correctly.
   */
  @Test
  void isUserResponsible_primaryResponsible_returnsTrue() {
    assertTrue(equipeService.isUserResponsible(equipe, responsable));
  }

  /**
   * Tests if the secondary responsible is recognized correctly.
   */
  @Test
  void isUserResponsible_secondaryResponsible_returnsTrue() {
    // Rule: secondary has the same rights as primary (ClarificationsV1 p.1)
    equipe.setResponsableSecondaire(membre);
    assertTrue(equipeService.isUserResponsible(equipe, membre));
  }

  /**
   * Tests if a simple member is recognized as not responsible.
   */
  @Test
  void isUserResponsible_simpleMember_returnsFalse() {
    assertFalse(equipeService.isUserResponsible(equipe, membre));
  }

  /**
   * Tests behavior when the team is null.
   */
  @Test
  void isUserResponsible_nullTeam_returnsFalse() {
    assertFalse(equipeService.isUserResponsible(null, responsable));
  }

  /**
   * Tests behavior when the user is null.
   */
  @Test
  void isUserResponsible_nullUser_returnsFalse() {
    assertFalse(equipeService.isUserResponsible(equipe, null));
  }

  // ═══════════════════════════════════════════════════════════════════
  // promouvoirResponsable
  // Rule: max 2 responsibles per team (Statement p.3)
  // Rule: only a responsible can promote another member (Statement p.3)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests a successful promotion of a member to a secondary responsible role.
   */
  @Test
  void promouvoirResponsable_memberBecomesSecondary_OK() {
    equipeService.promouvoirResponsable(responsable, 2L);

    assertEquals(membre, equipe.getResponsableSecondaire());
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests promotion failure when there are already two responsibles.
   */
  @Test
  void promouvoirResponsable_twoResponsiblesAlreadyPresent_throwsIllegalState() {
    // Rule: max 2 responsibles per team (Statement p.3)
    equipe.getMembres().add(tiers);
    equipe.setResponsableSecondaire(membre);

    assertThrows(
            IllegalStateException.class, () -> equipeService.promouvoirResponsable(responsable, 3L));
  }

  /**
   * Tests promotion failure when the member is already a responsible.
   */
  @Test
  void promouvoirResponsable_memberAlreadyResponsible_throwsIllegalState() {
    equipe.setResponsableSecondaire(membre);

    assertThrows(
            IllegalStateException.class, () -> equipeService.promouvoirResponsable(responsable, 2L));
  }

  /**
   * Tests promotion failure when the caller is not a responsible.
   */
  @Test
  void promouvoirResponsable_callerNotResponsible_throwsIllegalState() {
    assertThrows(
            IllegalStateException.class, () -> equipeService.promouvoirResponsable(membre, 1L));
  }

  // ═══════════════════════════════════════════════════════════════════
  // depromouvoirResponsable
  // Rule: there must always be AT LEAST 1 responsible (ClarificationsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests a successful demotion of a secondary responsible.
   */
  @Test
  void depromouvoirResponsable_secondaryDemoted_OK() {
    equipe.setResponsableSecondaire(membre);

    equipeService.depromouvoirResponsable(responsable, 2L);

    assertNull(equipe.getResponsableSecondaire());
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests demotion failure when trying to remove the very last responsible.
   */
  @Test
  void depromouvoirResponsable_lastResponsible_throwsIllegalState() {
    // Rule: there must always be at least 1 responsible (ClarificationsV1 p.1)
    assertThrows(
            IllegalStateException.class, () -> equipeService.depromouvoirResponsable(responsable, 1L));
  }

  /**
   * Tests demotion failure when the target is not actually a responsible.
   */
  @Test
  void depromouvoirResponsable_targetNotResponsible_throwsIllegalState() {
    assertThrows(
            IllegalStateException.class, () -> equipeService.depromouvoirResponsable(responsable, 2L));
  }

  /**
   * Tests demotion failure when the caller is not a responsible.
   */
  @Test
  void depromouvoirResponsable_callerNotResponsible_throwsIllegalState() {
    equipe.setResponsableSecondaire(responsable); // member is not responsible
    assertThrows(
            IllegalStateException.class, () -> equipeService.depromouvoirResponsable(membre, 1L));
  }

  // ═══════════════════════════════════════════════════════════════════
  // quitterEquipe
  // Rule: a team can NEVER be deleted (ClarificationsV1 p.2)
  // Rule: if responsible is the only member -> team emptied but KEPT
  // Rule: if responsible leaves, must designate a replacement (ClarificationsV1 p.1)
  // Rule: there must always remain at least 1 responsible (ClarificationsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tests a simple member leaving the team successfully.
   */
  @Test
  void quitterEquipe_simpleMember_OK() {
    equipeService.quitterEquipe(membre, null);

    assertNull(membre.getEquipe());
    assertFalse(equipe.getMembres().contains(membre));
    verify(userRepository).save(membre);
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests that when the last member leaves, the team is emptied but not deleted from the database.
   */
  @Test
  void quitterEquipe_responsibleOnlyMember_teamEmptiedButNeverDeleted() {
    // CRITICAL Rule: a team can NEVER be deleted (ClarificationsV1 p.2)
    equipe.setMembres(new ArrayList<>(List.of(responsable)));

    equipeService.quitterEquipe(responsable, null);

    assertNull(responsable.getEquipe());
    assertNull(equipe.getResponsablePrincipal());
    assertNull(equipe.getResponsableSecondaire());
    verify(equipeRepository, never()).delete(any()); // ← Never deleted!
    verify(equipeRepository).save(equipe); // ← Saved as empty
  }

  /**
   * Tests failure when a responsible tries to leave without appointing a replacement.
   */
  @Test
  void quitterEquipe_responsibleWithoutDesignatingReplacement_throwsIllegalState() {
    // Rule: must designate a replacement before leaving (ClarificationsV1 p.1)
    assertThrows(IllegalStateException.class, () -> equipeService.quitterEquipe(responsable, null));
  }

  /**
   * Tests success when a responsible appoints a replacement and leaves.
   */
  @Test
  void quitterEquipe_responsibleDesignatesReplacement_OK() {
    // Rule: can leave if they simultaneously designate a replacement (ClarificationsV1 p.1)
    equipeService.quitterEquipe(responsable, 2L);

    assertNull(responsable.getEquipe());
    // The member took over the responsible role
    assertEquals(membre, equipe.getResponsablePrincipal());
    verify(userRepository).save(responsable);
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests success when a responsible leaves but another responsible is already present.
   */
  @Test
  void quitterEquipe_responsibleWithTwoResponsibles_OK() {
    // Rule: can give up their role if another responsible is already there (ClarificationsV1 p.1)
    equipe.setResponsableSecondaire(membre);

    equipeService.quitterEquipe(responsable, null);

    assertNull(responsable.getEquipe());
    // The team still has a responsible
    assertNotNull(equipe.getResponsablePrincipal());
    verify(equipeRepository, never()).delete(any());
  }

  /**
   * Tests failure if a user tries to leave but they don't belong to any team.
   */
  @Test
  void quitterEquipe_memberWithoutTeam_throwsIllegalState() {
    User userSansEquipe = new User();
    userSansEquipe.setId(99L);
    userSansEquipe.setEquipe(null);

    assertThrows(
            IllegalStateException.class, () -> equipeService.quitterEquipe(userSansEquipe, null));
  }

  /**
   * Tests that a user is correctly removed even if the relations are slightly desynchronized.
   */
  @Test
  void quitterEquipe_memberWithDesynchronizedRelation_leavesAnyway() {
    membre.setEquipe(null);
    when(equipeRepository.findAll()).thenReturn(List.of(equipe));
    when(userRepository.findById(2L)).thenReturn(Optional.of(membre));

    equipeService.quitterEquipe(membre, null);

    assertNull(membre.getEquipe());
    assertFalse(equipe.getMembres().contains(membre));
    verify(userRepository).save(membre);
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests that a detached user entity is correctly reloaded and removed.
   */
  @Test
  void quitterEquipe_detachedUser_reloadsThenLeavesCorrectly() {
    User currentUserDetache = new User();
    currentUserDetache.setId(2L);
    currentUserDetache.setTag("BetaTag");
    currentUserDetache.setEquipe(equipe);

    when(userRepository.findById(2L)).thenReturn(Optional.of(membre));

    equipeService.quitterEquipe(currentUserDetache, null);

    assertNull(membre.getEquipe());
    assertFalse(equipe.getMembres().contains(membre));
    verify(userRepository).save(membre);
    verify(equipeRepository).save(equipe);
  }

  /**
   * Tests that the team always has at least 1 responsible remaining after someone leaves.
   */
  @Test
  void quitterEquipe_teamAlways1ResponsibleAfterLeave() {
    // Rule: there must always remain at least 1 responsible (ClarificationsV1 p.1)
    equipeService.quitterEquipe(responsable, 2L);

    int nbResponsables = 0;
    if (equipe.getResponsablePrincipal() != null) nbResponsables++;
    if (equipe.getResponsableSecondaire() != null) nbResponsables++;

    assertTrue(nbResponsables >= 1);
  }
}