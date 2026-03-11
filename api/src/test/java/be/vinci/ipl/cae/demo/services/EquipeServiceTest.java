package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
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

  @Mock private EquipeRepository equipeRepository;
  @Mock private UserRepository userRepository;
  @Mock private DemandeService demandService;
  @Mock private NotificationService notificationService;

  @InjectMocks private EquipeService equipeService;

  private User responsable;
  private User membre;
  private User tiers;
  private Equipe equipe;

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

    equipe = new Equipe();
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

  @Test
  void getAllEquipes_retourneToutesLesEquipes() {
    when(equipeRepository.findAll()).thenReturn(List.of(equipe));

    Iterable<Equipe> result = equipeService.getAllEquipes();

    assertTrue(result.iterator().hasNext());
  }

  // ═══════════════════════════════════════════════════════════════════
  // getEquipeById
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void getEquipeById_equipeExistante_retourneEquipe() {
    when(equipeRepository.findById(10L)).thenReturn(Optional.of(equipe));

    Optional<Equipe> result = equipeService.getEquipeById(10L);

    assertTrue(result.isPresent());
    assertEquals("Les Invincibles", result.get().getName());
  }

  @Test
  void getEquipeById_equipeInexistante_retourneEmpty() {
    when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

    assertTrue(equipeService.getEquipeById(99L).isEmpty());
  }

  // ═══════════════════════════════════════════════════════════════════
  // creerEquipe
  // Règle : le créateur devient automatiquement le responsable (Énoncé p.2)
  // Règle : deux teams ne peuvent pas avoir le même nom (PrécisionsV2 p.2)
  // Règle : un membre ne peut appartenir qu'à 1 seule team (Énoncé p.3)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void creerEquipe_createur_devientResponsablePrincipal() {
    // Règle : en créant une team, le membre en devient automatiquement le responsable (Énoncé p.2)
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);
    userSansEquipe.setEquipe(null);

    when(equipeRepository.existsByName("NewTeam")).thenReturn(false);
    when(userRepository.save(any())).thenReturn(userSansEquipe);
    when(equipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Equipe result = equipeService.creerEquipe(userSansEquipe, "NewTeam");

    assertNotNull(result);
    assertEquals("NewTeam", result.getName());
    assertEquals(userSansEquipe, result.getResponsablePrincipal());
    assertTrue(result.getMembres().contains(userSansEquipe));
  }

  @Test
  void creerEquipe_nomDejaExistant_retourneNull() {
    // Règle : deux teams ne peuvent pas avoir le même nom (PrécisionsV2 p.2)
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);
    userSansEquipe.setEquipe(null);

    when(equipeRepository.existsByName("Les Invincibles")).thenReturn(true);

    assertNull(equipeService.creerEquipe(userSansEquipe, "Les Invincibles"));
    verify(equipeRepository, never()).save(any());
  }

  @Test
  void creerEquipe_membreDejaInEquipe_throwsIllegalState() {
    // Règle : un membre ne peut appartenir qu'à 1 seule team à la fois (Énoncé p.3)
    assertThrows(
        IllegalStateException.class,
        () -> equipeService.creerEquipe(responsable, "NouvelleEquipe"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // demanderRejoindreEquipe
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void demanderRejoindreEquipe_delegueAuDemandeService() {
    User userSansEquipe = new User();
    userSansEquipe.setId(5L);

    equipeService.demanderRejoindreEquipe(userSansEquipe, 10L);

    verify(demandService).creerDemande(5L, 10L);
  }

  // ═══════════════════════════════════════════════════════════════════
  // isUserResponsible
  // Règle : principal et secondaire ont les MÊMES droits (PrécisionsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void isUserResponsible_responsablePrincipal_retourneTrue() {
    assertTrue(equipeService.isUserResponsible(equipe, responsable));
  }

  @Test
  void isUserResponsible_responsableSecondaire_retourneTrue() {
    // Règle : le secondaire a les mêmes droits que le principal (PrécisionsV1 p.1)
    equipe.setResponsableSecondaire(membre);
    assertTrue(equipeService.isUserResponsible(equipe, membre));
  }

  @Test
  void isUserResponsible_membreSimple_retourneFalse() {
    assertFalse(equipeService.isUserResponsible(equipe, membre));
  }

  @Test
  void isUserResponsible_equipeNull_retourneFalse() {
    assertFalse(equipeService.isUserResponsible(null, responsable));
  }

  @Test
  void isUserResponsible_userNull_retourneFalse() {
    assertFalse(equipeService.isUserResponsible(equipe, null));
  }

  // ═══════════════════════════════════════════════════════════════════
  // promouvoirResponsable
  // Règle : max 2 responsables par team (Énoncé p.3)
  // Règle : seul un responsable peut en promouvoir un autre (Énoncé p.3)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void promouvoirResponsable_membreDevientSecondaire_OK() {
    equipeService.promouvoirResponsable(responsable, 2L);

    assertEquals(membre, equipe.getResponsableSecondaire());
    verify(equipeRepository).save(equipe);
  }

  @Test
  void promouvoirResponsable_deuxResponsablesDejaPresents_throwsIllegalState() {
    // Règle : max 2 responsables par team (Énoncé p.3)
    equipe.getMembres().add(tiers);
    equipe.setResponsableSecondaire(membre);

    assertThrows(
        IllegalStateException.class, () -> equipeService.promouvoirResponsable(responsable, 3L));
  }

  @Test
  void promouvoirResponsable_membreDejaResponsable_throwsIllegalState() {
    equipe.setResponsableSecondaire(membre);

    assertThrows(
        IllegalStateException.class, () -> equipeService.promouvoirResponsable(responsable, 2L));
  }

  @Test
  void promouvoirResponsable_appelantNonResponsable_throwsIllegalState() {
    assertThrows(
        IllegalStateException.class, () -> equipeService.promouvoirResponsable(membre, 1L));
  }

  // ═══════════════════════════════════════════════════════════════════
  // depromouvoirResponsable
  // Règle : il doit toujours y avoir AU MINIMUM 1 responsable (PrécisionsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void depromouvoirResponsable_secondaireRedescend_OK() {
    equipe.setResponsableSecondaire(membre);

    equipeService.depromouvoirResponsable(responsable, 2L);

    assertNull(equipe.getResponsableSecondaire());
    verify(equipeRepository).save(equipe);
  }

  @Test
  void depromouvoirResponsable_dernierResponsable_throwsIllegalState() {
    // Règle : il doit toujours y avoir au minimum 1 responsable (PrécisionsV1 p.1)
    assertThrows(
        IllegalStateException.class, () -> equipeService.depromouvoirResponsable(responsable, 1L));
  }

  @Test
  void depromouvoirResponsable_cibleNonResponsable_throwsIllegalState() {
    assertThrows(
        IllegalStateException.class, () -> equipeService.depromouvoirResponsable(responsable, 2L));
  }

  @Test
  void depromouvoirResponsable_appelantNonResponsable_throwsIllegalState() {
    equipe.setResponsableSecondaire(responsable); // le membre n'est pas responsable
    assertThrows(
        IllegalStateException.class, () -> equipeService.depromouvoirResponsable(membre, 1L));
  }

  // ═══════════════════════════════════════════════════════════════════
  // quitterEquipe
  // Règle : une team ne peut jamais être supprimée (PrécisionsV1 p.2)
  // Règle : si responsable seul membre → team vidée mais CONSERVÉE
  // Règle : si responsable quitte, doit désigner un remplaçant (PrécisionsV1 p.1)
  // Règle : il doit toujours rester au moins 1 responsable (PrécisionsV1 p.1)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void quitterEquipe_membreSimple_OK() {
    equipeService.quitterEquipe(membre, null);

    assertNull(membre.getEquipe());
    assertFalse(equipe.getMembres().contains(membre));
    verify(userRepository).save(membre);
    verify(equipeRepository).save(equipe);
  }

  @Test
  void quitterEquipe_responsableSeulMembre_equipeVideeMaisJamaisSupprimee() {
    // Règle CRITIQUE : une team ne peut jamais être supprimée (PrécisionsV1 p.2)
    equipe.setMembres(new ArrayList<>(List.of(responsable)));

    equipeService.quitterEquipe(responsable, null);

    assertNull(responsable.getEquipe());
    assertNull(equipe.getResponsablePrincipal());
    assertNull(equipe.getResponsableSecondaire());
    verify(equipeRepository, never()).delete(any()); // ← jamais supprimée !
    verify(equipeRepository).save(equipe); // ← sauvegardée vide
  }

  @Test
  void quitterEquipe_responsableSansDesignerRemplacant_throwsIllegalState() {
    // Règle : doit désigner un remplaçant avant de quitter (PrécisionsV1 p.1)
    // responsable est le seul responsable mais pas le seul membre
    assertThrows(IllegalStateException.class, () -> equipeService.quitterEquipe(responsable, null));
  }

  @Test
  void quitterEquipe_responsableDesigneRemplacant_OK() {
    // Règle : peut quitter si désigne simultanément un remplaçant (PrécisionsV1 p.1)
    equipeService.quitterEquipe(responsable, 2L);

    assertNull(responsable.getEquipe());
    // Le membre a bien pris le rôle de responsable
    assertEquals(membre, equipe.getResponsablePrincipal());
    verify(userRepository).save(responsable);
    verify(equipeRepository).save(equipe);
  }

  @Test
  void quitterEquipe_responsableAvecDeuxResponsables_OK() {
    // Règle : peut renoncer à son rôle si un autre responsable est déjà là (PrécisionsV1 p.1)
    equipe.setResponsableSecondaire(membre);

    equipeService.quitterEquipe(responsable, null);

    assertNull(responsable.getEquipe());
    // La team a encore un responsable
    assertNotNull(equipe.getResponsablePrincipal());
    verify(equipeRepository, never()).delete(any());
  }

  @Test
  void quitterEquipe_membreSansEquipe_throwsIllegalState() {
    User userSansEquipe = new User();
    userSansEquipe.setId(99L);
    userSansEquipe.setEquipe(null);

    assertThrows(
        IllegalStateException.class, () -> equipeService.quitterEquipe(userSansEquipe, null));
  }

  @Test
  void quitterEquipe_membreAvecRelationDesynchronisee_quitteQuandMeme() {
    membre.setEquipe(null);
    when(equipeRepository.findAll()).thenReturn(List.of(equipe));
    when(userRepository.findById(2L)).thenReturn(Optional.of(membre));

    equipeService.quitterEquipe(membre, null);

    assertNull(membre.getEquipe());
    assertFalse(equipe.getMembres().contains(membre));
    verify(userRepository).save(membre);
    verify(equipeRepository).save(equipe);
  }

  @Test
  void quitterEquipe_utilisateurDetache_rechargePuisQuitteCorrectement() {
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

  @Test
  void quitterEquipe_teamToujours1ResponsableApresDepart() {
    // Règle : il doit toujours rester au moins 1 responsable (PrécisionsV1 p.1)
    equipeService.quitterEquipe(responsable, 2L);

    int nbResponsables = 0;
    if (equipe.getResponsablePrincipal() != null) nbResponsables++;
    if (equipe.getResponsableSecondaire() != null) nbResponsables++;

    assertTrue(nbResponsables >= 1);
  }
}
