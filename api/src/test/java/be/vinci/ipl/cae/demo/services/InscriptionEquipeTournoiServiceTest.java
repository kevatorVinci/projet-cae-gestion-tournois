package be.vinci.ipl.cae.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InscriptionEquipeTournoiServiceTest {

  @Mock
  private InscriptionEquipeTournoiRepository inscriptionRepository;
  @Mock
  private TournamentRepository tournoiRepository;
  @Mock
  private TeamRepository equipeRepository;
  @Mock
  private TournamentService tournoiService;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private RegisterTeamTournamentService service;

  // ── helpers ──────────────────────────────────────────────────────

  private Tournament makeTournoi(Long id, String etat) {
    Tournament t = new Tournament();
    t.setId(id);
    t.setNom("Tournoi " + id);
    t.setEtat(etat);
    return t;
  }

  private Team makeEquipe(Long id) {
    return makeEquipeWithMemberCount(id, 4);
  }

  private Team makeEquipeWithMemberCount(Long id, int memberCount) {
    Team e = new Team();
    e.setId(id);
    e.setName("Equipe " + id);
    for (int i = 0; i < memberCount; i++) {
      User u = new User();
      u.setId((id * 10) + i + 1);
      u.setTag("user" + i);
      u.setEquipe(e);
      e.getMembres().add(u);
    }
    return e;
  }

  private RegistrationTeamTournament makeInscription(Tournament tournoi, Team equipe) {
    RegistrationTeamTournament i = new RegistrationTeamTournament();
    i.setTournoi(tournoi);
    i.setEquipe(equipe);
    i.setDateInscription(LocalDate.now());
    return i;
  }

  // ═══════════════════════════════════════════════════════════════════
  // LECTURE
  // ═══════════════════════════════════════════════════════════════════

  @Nested
  @DisplayName("getAllByTournoi()")
  class GetAllByTournoi {

    @Test
    @DisplayName("retourne les inscriptions si le tournoi existe")
    void retourneInscriptions() {
      Tournament t = makeTournoi(1L, "OUVERT");
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(inscriptionRepository.findByTournoi(t)).thenReturn(List.of(i));

      Iterable<RegistrationTeamTournament> result = service.getAllByTournoi(1L);

      assertThat(result).containsExactly(i);
    }

    @Test
    @DisplayName("retourne null si le tournoi n'existe pas")
    void retourneNullSiTournoiInexistant() {
      when(tournoiRepository.findById(99L)).thenReturn(Optional.empty());

      Iterable<RegistrationTeamTournament> result = service.getAllByTournoi(99L);

      assertThat(result).isNull();
    }
  }

  @Nested
  @DisplayName("getAllByEquipe()")
  class GetAllByEquipe {

    @Test
    @DisplayName("retourne les inscriptions si l'équipe existe")
    void retourneInscriptions() {
      Team e = makeEquipe(1L);
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByEquipe(e)).thenReturn(List.of(i));

      Iterable<RegistrationTeamTournament> result = service.getAllByEquipe(1L);

      assertThat(result).containsExactly(i);
    }

    @Test
    @DisplayName("retourne null si l'équipe n'existe pas")
    void retourneNullSiEquipeInexistante() {
      when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

      Iterable<RegistrationTeamTournament> result = service.getAllByEquipe(99L);

      assertThat(result).isNull();
    }
  }

  @Nested
  @DisplayName("getById()")
  class GetById {

    @Test
    @DisplayName("retourne l'inscription si elle existe")
    void retourneInscription() {
      RegistrationTeamTournament i = new RegistrationTeamTournament();
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      RegistrationTeamTournament result = service.getById(1L);

      assertThat(result).isEqualTo(i);
    }

    @Test
    @DisplayName("retourne null si l'inscription n'existe pas")
    void retourneNullSiInexistant() {
      when(inscriptionRepository.findById(99L)).thenReturn(Optional.empty());

      RegistrationTeamTournament result = service.getById(99L);

      assertThat(result).isNull();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // INSCRIPTION
  // ═══════════════════════════════════════════════════════════════════

  @Nested
  @DisplayName("register()")
  class Register {

    @Test
    @DisplayName("inscrit l'équipe si le tournoi est OUVERT et l'équipe pas encore inscrite")
    void inscritAvecSucces() {
      Tournament t = makeTournoi(1L, "OUVERT");
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
      when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      RegistrationTeamTournament result = service.register(1L, 1L);

      assertThat(result).isNotNull();
      assertThat(result.getTournoi()).isEqualTo(t);
      assertThat(result.getEquipe()).isEqualTo(e);
      assertThat(result.getDateInscription()).isEqualTo(LocalDate.now());
      verify(notificationService, times(4)).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("retourne une erreur si l'équipe a moins de 4 membres")
    void erreurSiMoinsDeQuatreMembres() {
      Tournament t = makeTournoi(1L, "OUVERT");
      Team e = makeEquipeWithMemberCount(1L, 3);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));

      IllegalArgumentException exception = org.junit.jupiter.api.Assertions.assertThrows(
          IllegalArgumentException.class,
          () -> service.register(1L, 1L)
      );

      assertThat(exception.getMessage())
          .isEqualTo("Une équipe doit avoir au moins 4 membres pour s'inscrire à un tournoi.");
      verify(inscriptionRepository, never()).save(any());
      verify(notificationService, never()).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("retourne null si le tournoi n'est pas OUVERT")
    void retourneNullSiTournoiPasOuvert() {
      Tournament t = makeTournoi(1L, "CLOTURE");
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));

      RegistrationTeamTournament result = service.register(1L, 1L);

      assertThat(result).isNull();
      verify(inscriptionRepository, never()).save(any());
      verify(notificationService, never()).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("retourne null si le tournoi n'existe pas")
    void retourneNullSiTournoiInexistant() {
      when(tournoiRepository.findById(99L)).thenReturn(Optional.empty());

      RegistrationTeamTournament result = service.register(99L, 1L);

      assertThat(result).isNull();
      verify(notificationService, never()).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("retourne null si l'équipe n'existe pas")
    void retourneNullSiEquipeInexistante() {
      Tournament t = makeTournoi(1L, "OUVERT");
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

      RegistrationTeamTournament result = service.register(1L, 99L);

      assertThat(result).isNull();
      verify(notificationService, never()).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("retourne null si l'équipe est déjà inscrite")
    void retourneNullSiDejaInscrit() {
      Tournament t = makeTournoi(1L, "OUVERT");
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e))
          .thenReturn(Optional.of(makeInscription(t, e)));

      RegistrationTeamTournament result = service.register(1L, 1L);

      assertThat(result).isNull();
      verify(inscriptionRepository, never()).save(any());
      verify(notificationService, never()).createNotification(any(User.class), anyString());
    }

    @Test
    @DisplayName("clôture automatiquement le tournoi si le max de participants est atteint")
    void clotureAutoSiMax() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setNombresParticipantsMax(2);
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
      when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
      // Simule 2 inscrits après l'ajout (max atteint)
      when(inscriptionRepository.findByTournoi(t)).thenReturn(
          List.of(new RegistrationTeamTournament(), new RegistrationTeamTournament())
      );

      service.register(1L, 1L);

      verify(tournoiService).closeRegistrations(1L);
    }

    @Test
    @DisplayName("ne clôture pas si le max n'est pas encore atteint")
    void pasDeClotureAutoSiPasMax() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setNombresParticipantsMax(5);
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
      when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
      when(inscriptionRepository.findByTournoi(t)).thenReturn(
          List.of(new RegistrationTeamTournament())
      );

      service.register(1L, 1L);

      verify(tournoiService, never()).closeRegistrations(any());
    }

    @Test
    @DisplayName("ne clôture pas si pas de max défini")
    void pasDeClotureAutoSiPasDeMax() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setNombresParticipantsMax(null);
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
      when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      service.register(1L, 1L);

      verify(tournoiService, never()).closeRegistrations(any());
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DÉSINSCRIPTION PAR ID
  // ═══════════════════════════════════════════════════════════════════

  @Nested
  @DisplayName("unregister()")
  class Unregister {

    @Test
    @DisplayName("désinscrit si tournoi OUVERT et date non dépassée")
    void desinscritAvecSucces() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setDateLimiteInscription(LocalDate.now().plusDays(5));
      Team e = makeEquipe(1L);
      RegistrationTeamTournament i = makeInscription(t, e);
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isTrue();
      verify(inscriptionRepository).delete(i);
    }

    @Test
    @DisplayName("retourne false si l'inscription n'existe pas")
    void retourneFalseSiInexistant() {
      when(inscriptionRepository.findById(99L)).thenReturn(Optional.empty());

      boolean result = service.unregister(99L);

      assertThat(result).isFalse();
      verify(inscriptionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("retourne false si le tournoi est CLOTURE")
    void retourneFalseSiCloture() {
      Tournament t = makeTournoi(1L, "CLOTURE");
      RegistrationTeamTournament i = makeInscription(t, makeEquipe(1L));
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isFalse();
      verify(inscriptionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("retourne false si le tournoi est EN_COURS")
    void retourneFalseSiEnCours() {
      Tournament t = makeTournoi(1L, "EN_COURS");
      RegistrationTeamTournament i = makeInscription(t, makeEquipe(1L));
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("retourne false si la date limite est dépassée")
    void retourneFalseSiDateLimiteDepassee() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setDateLimiteInscription(LocalDate.now().minusDays(1));
      RegistrationTeamTournament i = makeInscription(t, makeEquipe(1L));
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isFalse();
      verify(inscriptionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("désinscrit si pas de date limite définie")
    void desinscritSansDatelimite() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setDateLimiteInscription(null);
      RegistrationTeamTournament i = makeInscription(t, makeEquipe(1L));
      when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

      boolean result = service.unregister(1L);

      assertThat(result).isTrue();
      verify(inscriptionRepository).delete(i);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DÉSINSCRIPTION PAR TOURNOI + ÉQUIPE
  // ═══════════════════════════════════════════════════════════════════

  @Nested
  @DisplayName("unregisterByTournoiAndEquipe()")
  class UnregisterByTournoiAndEquipe {

    @Test
    @DisplayName("désinscrit via la clé logique si conditions OK")
    void desinscritAvecSucces() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setDateLimiteInscription(LocalDate.now().plusDays(5));
      Team e = makeEquipe(1L);
      RegistrationTeamTournament i = makeInscription(t, e);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.of(i));

      boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

      assertThat(result).isTrue();
      verify(inscriptionRepository).delete(i);
    }

    @Test
    @DisplayName("retourne false si le tournoi n'existe pas")
    void retourneFalseSiTournoiInexistant() {
      when(tournoiRepository.findById(99L)).thenReturn(Optional.empty());
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(makeEquipe(1L)));

      boolean result = service.unregisterByTournoiAndEquipe(99L, 1L);

      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("retourne false si l'équipe n'existe pas")
    void retourneFalseSiEquipeInexistante() {
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(makeTournoi(1L, "OUVERT")));
      when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

      boolean result = service.unregisterByTournoiAndEquipe(1L, 99L);

      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("retourne false si l'inscription n'existe pas")
    void retourneFalseSiInscriptionInexistante() {
      Tournament t = makeTournoi(1L, "OUVERT");
      Team e = makeEquipe(1L);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());

      boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("retourne false si le tournoi n'est pas OUVERT")
    void retourneFalseSiTournoiPasOuvert() {
      Tournament t = makeTournoi(1L, "CLOTURE");
      Team e = makeEquipe(1L);
      RegistrationTeamTournament i = makeInscription(t, e);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.of(i));

      boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

      assertThat(result).isFalse();
      verify(inscriptionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("retourne false si la date limite est dépassée")
    void retourneFalseSiDateLimiteDepassee() {
      Tournament t = makeTournoi(1L, "OUVERT");
      t.setDateLimiteInscription(LocalDate.now().minusDays(1));
      Team e = makeEquipe(1L);
      RegistrationTeamTournament i = makeInscription(t, e);
      when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
      when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
      when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.of(i));

      boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

      assertThat(result).isFalse();
      verify(inscriptionRepository, never()).delete(any());
    }
  }
}