package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.entities.Demande;
import be.vinci.ipl.cae.demo.models.entities.Demande.EtatDemande;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandeRepository;
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
class DemandeServiceTest {

  @Mock private DemandeRepository demandeRepo;
  @Mock private UserRepository userRepo;
  @Mock private EquipeRepository equipeRepo;

  @InjectMocks private DemandeService demandeService;

  private User membre;
  private User responsable;
  private Equipe equipe;
  private Demande demande;

  @BeforeEach
  void setUp() {
    responsable = new User();
    responsable.setId(1L);

    membre = new User();
    membre.setId(2L);
    membre.setEquipe(null); // pas encore dans une équipe

    equipe = new Equipe();
    equipe.setId(10L);
    equipe.setName("Les Invincibles");
    equipe.setResponsablePrincipal(responsable);
    equipe.setMembres(new ArrayList<>(List.of(responsable)));

    demande = new Demande();
    demande.setIdDemande(100L);
    demande.setMembre(membre);
    demande.setEquipe(equipe);
    demande.setEtat(EtatDemande.EN_ATTENTE);
  }

  // ═══════════════════════════════════════════════════════════════════
  // creerDemande
  // Règle : un membre sans équipe peut postuler à une équipe existante.
  // Règle : un membre déjà dans une équipe ne peut pas postuler. (Énoncé p.3)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void creerDemande_membreSansEquipe_OK() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(membre));
    when(equipeRepo.findById(10L)).thenReturn(Optional.of(equipe));
    when(demandeRepo.save(any())).thenReturn(demande);

    Demande result = demandeService.creerDemande(2L, 10L);

    assertNotNull(result);
    assertEquals(EtatDemande.EN_ATTENTE, result.getEtat());
    verify(demandeRepo).save(any());
  }

  @Test
  void creerDemande_membreDejaInEquipe_throwsRuntime() {
    // Règle : un membre ne peut appartenir qu'à 1 seule team à la fois (Énoncé p.3)
    membre.setEquipe(equipe);
    when(userRepo.findById(2L)).thenReturn(Optional.of(membre));
    when(equipeRepo.findById(10L)).thenReturn(Optional.of(equipe));

    assertThrows(RuntimeException.class, () -> demandeService.creerDemande(2L, 10L));
    verify(demandeRepo, never()).save(any());
  }

  @Test
  void creerDemande_membreInexistant_throwsRuntime() {
    when(userRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandeService.creerDemande(99L, 10L));
  }

  @Test
  void creerDemande_equipeInexistante_throwsRuntime() {
    when(userRepo.findById(2L)).thenReturn(Optional.of(membre));
    when(equipeRepo.findById(99L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandeService.creerDemande(2L, 99L));
  }

  @Test
  void creerDemande_equipeSansResponsable_throwsRuntime() {
    // Règle : une team sans responsable ne peut plus accueillir de nouveaux membres (PrécisionsV1
    // p.2)
    equipe.setResponsablePrincipal(null);
    equipe.setResponsableSecondaire(null);

    when(userRepo.findById(2L)).thenReturn(Optional.of(membre));
    when(equipeRepo.findById(10L)).thenReturn(Optional.of(equipe));

    assertThrows(RuntimeException.class, () -> demandeService.creerDemande(2L, 10L));
    verify(demandeRepo, never()).save(any());
  }

  // ═══════════════════════════════════════════════════════════════════
  // getDemandesEnAttentePourEquipe
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void getDemandesEnAttentePourEquipe_retourneListe() {
    when(demandeRepo.findByEquipeIdAndEtat(10L, EtatDemande.EN_ATTENTE))
        .thenReturn(List.of(demande));

    Iterable<Demande> result = demandeService.getDemandesEnAttentePourEquipe(10L);

    assertTrue(result.iterator().hasNext());
  }

  @Test
  void getDemandesEnAttentePourEquipe_aucuneDemande_retourneVide() {
    when(demandeRepo.findByEquipeIdAndEtat(10L, EtatDemande.EN_ATTENTE)).thenReturn(List.of());

    Iterable<Demande> result = demandeService.getDemandesEnAttentePourEquipe(10L);

    assertFalse(result.iterator().hasNext());
  }

  // ═══════════════════════════════════════════════════════════════════
  // accepterDemande
  // Règle : seul un responsable peut accepter une demande (Énoncé p.3)
  // Règle : le membre rejoint effectivement l'équipe après acceptation
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void accepterDemande_parResponsable_OK() {
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(userRepo.save(any())).thenReturn(membre);
    when(equipeRepo.save(any())).thenReturn(equipe);
    when(demandeRepo.save(any())).thenReturn(demande);

    Demande result = demandeService.accepterDemande(100L, responsable);

    assertEquals(EtatDemande.ACCEPTEE, result.getEtat());
    assertNotNull(result.getDateTraitement());
    // Le membre a bien rejoint l'équipe
    assertEquals(equipe, membre.getEquipe());
    assertTrue(equipe.getMembres().contains(membre));
  }

  @Test
  void accepterDemande_membreAjouteALEquipe() {
    // Règle : après acceptation, le membre appartient à la team (Énoncé p.2)
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(userRepo.save(any())).thenReturn(membre);
    when(equipeRepo.save(any())).thenReturn(equipe);
    when(demandeRepo.save(any())).thenReturn(demande);

    demandeService.accepterDemande(100L, responsable);

    verify(userRepo).save(membre);
    verify(equipeRepo).save(equipe);
  }

  @Test
  void accepterDemande_demandeInexistante_throwsRuntime() {
    when(demandeRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(RuntimeException.class, () -> demandeService.accepterDemande(999L, responsable));
  }

  @Test
  void accepterDemande_utilisateurNonResponsable_throwsSecurity() {
    // Règle : seul le responsable gère les demandes (Énoncé p.3)
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));

    assertThrows(SecurityException.class, () -> demandeService.accepterDemande(100L, membre));
  }

  @Test
  void accepterDemande_responsableSecondaire_OK() {
    // Règle : responsable principal et secondaire ont les MÊMES droits (PrécisionsV1 p.1)
    User respSecondaire = new User();
    respSecondaire.setId(3L);
    equipe.setResponsableSecondaire(respSecondaire);

    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(userRepo.save(any())).thenReturn(membre);
    when(equipeRepo.save(any())).thenReturn(equipe);
    when(demandeRepo.save(any())).thenReturn(demande);

    assertDoesNotThrow(() -> demandeService.accepterDemande(100L, respSecondaire));
  }

  // ═══════════════════════════════════════════════════════════════════
  // refuserDemande
  // Règle : en cas de refus, le responsable DOIT ajouter une raison (Énoncé p.2)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void refuserDemande_avecRaison_OK() {
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(demandeRepo.save(any())).thenReturn(demande);

    Demande result = demandeService.refuserDemande(100L, "Niveau insuffisant", responsable);

    assertEquals(EtatDemande.REFUSEE, result.getEtat());
    assertEquals("Niveau insuffisant", result.getRaisonRefus());
    assertNotNull(result.getDateTraitement());
  }

  @Test
  void refuserDemande_responsableSecondaire_OK() {
    // Règle : responsable principal et secondaire ont les MÊMES droits (PrécisionsV1 p.1)
    User respSecondaire = new User();
    respSecondaire.setId(3L);
    equipe.setResponsableSecondaire(respSecondaire);

    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(demandeRepo.save(any())).thenReturn(demande);

    assertDoesNotThrow(
        () -> demandeService.refuserDemande(100L, "Manque d'expérience", respSecondaire));
  }

  @Test
  void refuserDemande_utilisateurNonResponsable_throwsSecurity() {
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));

    assertThrows(
        SecurityException.class, () -> demandeService.refuserDemande(100L, "raison", membre));
  }

  @Test
  void refuserDemande_demandeInexistante_throwsRuntime() {
    when(demandeRepo.findById(999L)).thenReturn(Optional.empty());

    assertThrows(
        RuntimeException.class, () -> demandeService.refuserDemande(999L, "raison", responsable));
  }

  @Test
  void refuserDemande_membreNePasRejoindreLEquipe() {
    // Règle : un refus ne doit PAS modifier l'équipe du membre
    when(demandeRepo.findById(100L)).thenReturn(Optional.of(demande));
    when(demandeRepo.save(any())).thenReturn(demande);

    demandeService.refuserDemande(100L, "Raison", responsable);

    assertNull(membre.getEquipe()); // le membre reste sans équipe
    verify(userRepo, never()).save(any());
    verify(equipeRepo, never()).save(any());
  }
}
