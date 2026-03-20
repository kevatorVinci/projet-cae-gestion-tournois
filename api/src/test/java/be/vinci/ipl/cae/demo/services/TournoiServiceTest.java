package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for {@link TournoiService}. */
@ExtendWith(MockitoExtension.class)
class TournoiServiceTest {

    @Mock private TournoiRepository tournoiRepository;
    @Mock private InscriptionEquipeTournoiService inscriptionService;

    @InjectMocks private TournoiService tournoiService;

    private Tournoi tournoi;

    @BeforeEach
    void setUp() {
        tournoi = new Tournoi();
        tournoi.setId(1L);
        tournoi.setNom("Summer Cup");
        tournoi.setEtat("BROUILLON");
    }

    @Test
    void getAllPublic_shouldReturnOnlyNonDraftTournaments() {
        Tournoi publicTournoi = new Tournoi();
        publicTournoi.setEtat("OUVERT");
        when(tournoiRepository.findAll()).thenReturn(Arrays.asList(tournoi, publicTournoi));

        Iterable<Tournoi> result = tournoiService.getAllPublic();
        List<Tournoi> resultList = (List<Tournoi>) result;

        assertEquals(1, resultList.size());
        assertEquals("OUVERT", resultList.get(0).getEtat());
    }

    @Test
    void getAll_shouldReturnAllTournaments() {
        when(tournoiRepository.findAll()).thenReturn(List.of(tournoi));
        Iterable<Tournoi> result = tournoiService.getAll();
        assertNotNull(result);
        verify(tournoiRepository).findAll();
    }

    @Test
    void getOne_shouldReturnTournamentWhenFound() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        Optional<Tournoi> result = tournoiService.getOne(1L);
        assertTrue(result.isPresent());
        assertEquals("Summer Cup", result.get().getNom());
    }

    @Test
    void create_shouldReturnNullIfNameAlreadyExists() {
        when(tournoiRepository.findByNom("Summer Cup")).thenReturn(Optional.of(tournoi));
        Tournoi result = tournoiService.create(tournoi);
        assertNull(result);
    }

    @Test
    void create_shouldSaveAsDraftIfNameIsUnique() {
        when(tournoiRepository.findByNom(any())).thenReturn(Optional.empty());
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.create(tournoi);

        assertNotNull(result);
        assertEquals("BROUILLON", result.getEtat());
        verify(tournoiRepository).save(tournoi);
    }

    @Test
    void update_shouldReturnNullIfNotDraft() {
        tournoi.setEtat("OUVERT");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));

        Tournoi payload = new Tournoi();
        payload.setNom("New Name");

        Tournoi result = tournoiService.update(1L, payload);
        assertNull(result);
    }

    @Test
    void publish_shouldChangeStateToOuvert() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.publish(1L);

        assertNotNull(result);
        assertEquals("OUVERT", result.getEtat());
    }

    @Test
    void closeRegistrations_shouldChangeStateToCloture() {
        tournoi.setEtat("OUVERT");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.closeRegistrations(1L);

        assertNotNull(result);
        assertEquals("CLOTURE", result.getEtat());
    }

    @Test
    void start_shouldRefusePendingAndChangeStateToEnCours() {
        tournoi.setEtat("CLOTURE");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.start(1L);

        assertNotNull(result);
        assertEquals("EN_COURS", result.getEtat());
        verify(inscriptionService).refuseAllPending(tournoi);
    }

    @Test
    void finish_shouldChangeStateToTermine() {
        tournoi.setEtat("EN_COURS");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.finish(1L);

        assertNotNull(result);
        assertEquals("TERMINE", result.getEtat());
    }

    @Test
    void cancel_shouldChangeStateToAnnule() {
        tournoi.setEtat("OUVERT");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(tournoiRepository.save(any(Tournoi.class))).thenReturn(tournoi);

        Tournoi result = tournoiService.cancel(1L);

        assertNotNull(result);
        assertEquals("ANNULE", result.getEtat());
    }
}