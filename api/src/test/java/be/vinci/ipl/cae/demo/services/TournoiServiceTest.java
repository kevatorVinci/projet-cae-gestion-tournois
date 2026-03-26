package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InscriptionEquipeTournoiServiceTest {

    @Mock
    private InscriptionEquipeTournoiRepository inscriptionRepository;
    @Mock
    private TournoiRepository tournoiRepository;
    @Mock
    private EquipeRepository equipeRepository;
    @Mock
    private TournoiService tournoiService;

    @InjectMocks
    private InscriptionEquipeTournoiService service;

    // ── helpers ──────────────────────────────────────────────────────

    private Tournoi makeTournoi(Long id, String etat) {
        Tournoi t = new Tournoi();
        t.setId(id);
        t.setNom("Tournoi " + id);
        t.setEtat(etat);
        return t;
    }

    private Equipe makeEquipe(Long id) {
        Equipe e = new Equipe();
        e.setId(id);
        e.setNom("Equipe " + id);
        return e;
    }

    private InscriptionEquipeTournoi makeInscription(Tournoi tournoi, Equipe equipe) {
        InscriptionEquipeTournoi i = new InscriptionEquipeTournoi();
        i.setId(1L);
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
            Tournoi t = makeTournoi(1L, "OUVERT");
            InscriptionEquipeTournoi i = new InscriptionEquipeTournoi();
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(inscriptionRepository.findByTournoi(t)).thenReturn(List.of(i));

            Iterable<InscriptionEquipeTournoi> result = service.getAllByTournoi(1L);

            assertThat(result).containsExactly(i);
        }

        @Test
        @DisplayName("retourne null si le tournoi n'existe pas")
        void retourneNullSiTournoiInexistant() {
            when(tournoiRepository.findById(99L)).thenReturn(Optional.empty());

            Iterable<InscriptionEquipeTournoi> result = service.getAllByTournoi(99L);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("getAllByEquipe()")
    class GetAllByEquipe {

        @Test
        @DisplayName("retourne les inscriptions si l'équipe existe")
        void retourneInscriptions() {
            Equipe e = makeEquipe(1L);
            InscriptionEquipeTournoi i = new InscriptionEquipeTournoi();
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByEquipe(e)).thenReturn(List.of(i));

            Iterable<InscriptionEquipeTournoi> result = service.getAllByEquipe(1L);

            assertThat(result).containsExactly(i);
        }

        @Test
        @DisplayName("retourne null si l'équipe n'existe pas")
        void retourneNullSiEquipeInexistante() {
            when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

            Iterable<InscriptionEquipeTournoi> result = service.getAllByEquipe(99L);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("retourne l'inscription si elle existe")
        void retourneInscription() {
            InscriptionEquipeTournoi i = new InscriptionEquipeTournoi();
            i.setId(1L);
            when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

            InscriptionEquipeTournoi result = service.getById(1L);

            assertThat(result).isEqualTo(i);
        }

        @Test
        @DisplayName("retourne null si l'inscription n'existe pas")
        void retourneNullSiInexistant() {
            when(inscriptionRepository.findById(99L)).thenReturn(Optional.empty());

            InscriptionEquipeTournoi result = service.getById(99L);

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
            Tournoi t = makeTournoi(1L, "OUVERT");
            Equipe e = makeEquipe(1L);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
            when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(inscriptionRepository.findByTournoi(t)).thenReturn(List.of());

            InscriptionEquipeTournoi result = service.register(1L, 1L);

            assertThat(result).isNotNull();
            assertThat(result.getTournoi()).isEqualTo(t);
            assertThat(result.getEquipe()).isEqualTo(e);
            assertThat(result.getDateInscription()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("retourne null si le tournoi n'est pas OUVERT")
        void retourneNullSiTournoiPasOuvert() {
            Tournoi t = makeTournoi(1L, "CLOTURE");
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));

            InscriptionEquipeTournoi result = service.register(1L, 1L);

            assertThat(result).isNull();
            verify(inscriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("retourne null si le tournoi n'existe pas")
        void retourneNullSiTournoiInexistant() {
            when(tournoiRepository.findById(99L)).thenReturn(Optional.empty());

            InscriptionEquipeTournoi result = service.register(99L, 1L);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("retourne null si l'équipe n'existe pas")
        void retourneNullSiEquipeInexistante() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

            InscriptionEquipeTournoi result = service.register(1L, 99L);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("retourne null si l'équipe est déjà inscrite")
        void retourneNullSiDejaInscrit() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            Equipe e = makeEquipe(1L);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e))
                    .thenReturn(Optional.of(makeInscription(t, e)));

            InscriptionEquipeTournoi result = service.register(1L, 1L);

            assertThat(result).isNull();
            verify(inscriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("clôture automatiquement le tournoi si le max de participants est atteint")
        void clotureAutoSiMax() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setNombresParticipantsMax(2);
            Equipe e = makeEquipe(1L);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
            when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            // Simule 2 inscrits après l'ajout (max atteint)
            when(inscriptionRepository.findByTournoi(t)).thenReturn(
                    List.of(new InscriptionEquipeTournoi(), new InscriptionEquipeTournoi())
            );

            service.register(1L, 1L);

            verify(tournoiService).closeRegistrations(1L);
        }

        @Test
        @DisplayName("ne clôture pas si le max n'est pas encore atteint")
        void pasDeClotureAutoSiPasMax() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setNombresParticipantsMax(5);
            Equipe e = makeEquipe(1L);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());
            when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(inscriptionRepository.findByTournoi(t)).thenReturn(
                    List.of(new InscriptionEquipeTournoi())
            );

            service.register(1L, 1L);

            verify(tournoiService, never()).closeRegistrations(any());
        }

        @Test
        @DisplayName("ne clôture pas si pas de max défini")
        void pasDeClotureAutoSiPasDeMax() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setNombresParticipantsMax(null);
            Equipe e = makeEquipe(1L);
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
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setDateLimiteInscription(LocalDate.now().plusDays(5));
            Equipe e = makeEquipe(1L);
            InscriptionEquipeTournoi i = makeInscription(t, e);
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
            Tournoi t = makeTournoi(1L, "CLOTURE");
            InscriptionEquipeTournoi i = makeInscription(t, makeEquipe(1L));
            when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

            boolean result = service.unregister(1L);

            assertThat(result).isFalse();
            verify(inscriptionRepository, never()).delete(any());
        }

        @Test
        @DisplayName("retourne false si le tournoi est EN_COURS")
        void retourneFalseSiEnCours() {
            Tournoi t = makeTournoi(1L, "EN_COURS");
            InscriptionEquipeTournoi i = makeInscription(t, makeEquipe(1L));
            when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

            boolean result = service.unregister(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("retourne false si la date limite est dépassée")
        void retourneFalseSiDateLimiteDepassee() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setDateLimiteInscription(LocalDate.now().minusDays(1));
            InscriptionEquipeTournoi i = makeInscription(t, makeEquipe(1L));
            when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(i));

            boolean result = service.unregister(1L);

            assertThat(result).isFalse();
            verify(inscriptionRepository, never()).delete(any());
        }

        @Test
        @DisplayName("désinscrit si pas de date limite définie")
        void desinscritSansDatelimite() {
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setDateLimiteInscription(null);
            InscriptionEquipeTournoi i = makeInscription(t, makeEquipe(1L));
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
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setDateLimiteInscription(LocalDate.now().plusDays(5));
            Equipe e = makeEquipe(1L);
            InscriptionEquipeTournoi i = makeInscription(t, e);
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
            Tournoi t = makeTournoi(1L, "OUVERT");
            Equipe e = makeEquipe(1L);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.empty());

            boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("retourne false si le tournoi n'est pas OUVERT")
        void retourneFalseSiTournoiPasOuvert() {
            Tournoi t = makeTournoi(1L, "CLOTURE");
            Equipe e = makeEquipe(1L);
            InscriptionEquipeTournoi i = makeInscription(t, e);
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
            Tournoi t = makeTournoi(1L, "OUVERT");
            t.setDateLimiteInscription(LocalDate.now().minusDays(1));
            Equipe e = makeEquipe(1L);
            InscriptionEquipeTournoi i = makeInscription(t, e);
            when(tournoiRepository.findById(1L)).thenReturn(Optional.of(t));
            when(equipeRepository.findById(1L)).thenReturn(Optional.of(e));
            when(inscriptionRepository.findByTournoiAndEquipe(t, e)).thenReturn(Optional.of(i));

            boolean result = service.unregisterByTournoiAndEquipe(1L, 1L);

            assertThat(result).isFalse();
            verify(inscriptionRepository, never()).delete(any());
        }
    }
}