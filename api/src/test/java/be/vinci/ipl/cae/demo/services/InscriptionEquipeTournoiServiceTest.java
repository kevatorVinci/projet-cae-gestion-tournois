package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for {@link InscriptionEquipeTournoiService}. */
@ExtendWith(MockitoExtension.class)
class InscriptionEquipeTournoiServiceTest {

    @Mock private InscriptionEquipeTournoiRepository inscriptionRepository;
    @Mock private TournoiRepository tournoiRepository;
    @Mock private EquipeRepository equipeRepository;
    @Mock private TournoiService tournoiService;

    @InjectMocks private InscriptionEquipeTournoiService inscriptionService;

    private Tournoi tournoi;
    private Equipe equipe;
    private InscriptionEquipeTournoi inscription;

    @BeforeEach
    void setUp() {
        tournoi = new Tournoi();
        tournoi.setId(1L);
        tournoi.setEtat("OUVERT");
        tournoi.setNombresParticipantsMax(2);

        equipe = new Equipe();
        equipe.setId(10L);

        inscription = new InscriptionEquipeTournoi();
        inscription.setTournoi(tournoi);
        inscription.setEquipe(equipe);
        inscription.setEtat("EN_ATTENTE");
    }

    @Test
    void getAllByTournoi_shouldReturnListIfTournoiExists() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(inscriptionRepository.findByTournoi(tournoi)).thenReturn(List.of(inscription));

        Iterable<InscriptionEquipeTournoi> result = inscriptionService.getAllByTournoi(1L);
        assertNotNull(result);
        verify(inscriptionRepository).findByTournoi(tournoi);
    }

    @Test
    void getAcceptedByTournoi_shouldReturnOnlyValidated() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(inscriptionRepository.findByTournoiAndEtat(tournoi, "VALIDEE"))
                .thenReturn(List.of(inscription));

        Iterable<InscriptionEquipeTournoi> result = inscriptionService.getAcceptedByTournoi(1L);
        assertNotNull(result);
        verify(inscriptionRepository).findByTournoiAndEtat(tournoi, "VALIDEE");
    }

    @Test
    void getAllByEquipe_shouldReturnListIfEquipeExists() {
        when(equipeRepository.findById(10L)).thenReturn(Optional.of(equipe));
        when(inscriptionRepository.findByEquipe(equipe)).thenReturn(List.of(inscription));

        Iterable<InscriptionEquipeTournoi> result = inscriptionService.getAllByEquipe(10L);
        assertNotNull(result);
        verify(inscriptionRepository).findByEquipe(equipe);
    }

    @Test
    void getById_shouldReturnInscriptionWhenFound() {
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));
        InscriptionEquipeTournoi result = inscriptionService.getById(1L);
        assertNotNull(result);
    }

    @Test
    void getPendingByTournoi_shouldReturnOnlyPending() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(inscriptionRepository.findByTournoiAndEtat(tournoi, "EN_ATTENTE"))
                .thenReturn(List.of(inscription));

        Iterable<InscriptionEquipeTournoi> result = inscriptionService.getPendingByTournoi(1L);
        assertNotNull(result);
    }

    @Test
    void getRefusedByTournoi_shouldReturnOnlyRefused() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(inscriptionRepository.findByTournoiAndEtat(tournoi, "REFUSEE"))
                .thenReturn(List.of(inscription));

        Iterable<InscriptionEquipeTournoi> result = inscriptionService.getRefusedByTournoi(1L);
        assertNotNull(result);
    }

    @Test
    void register_shouldReturnNullIfTournoiNotOuvert() {
        tournoi.setEtat("BROUILLON");
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));

        InscriptionEquipeTournoi result = inscriptionService.register(1L, 10L);
        assertNull(result);
    }

    @Test
    void register_shouldSaveIfValid() {
        when(tournoiRepository.findById(1L)).thenReturn(Optional.of(tournoi));
        when(equipeRepository.findById(10L)).thenReturn(Optional.of(equipe));
        when(inscriptionRepository.findByTournoiAndEquipe(tournoi, equipe))
                .thenReturn(Optional.empty());
        when(inscriptionRepository.save(any(InscriptionEquipeTournoi.class))).thenReturn(inscription);

        InscriptionEquipeTournoi result = inscriptionService.register(1L, 10L);

        assertNotNull(result);
        verify(inscriptionRepository).save(any(InscriptionEquipeTournoi.class));
    }

    @Test
    void validate_shouldCloseRegistrationsIfMaxReached() {
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepository.save(any(InscriptionEquipeTournoi.class))).thenReturn(inscription);

        // Simulate that by adding this one, we reach the maximum limit of 2 participants
        when(inscriptionRepository.findByTournoiAndEtat(tournoi, "VALIDEE"))
                .thenReturn(List.of(inscription, inscription));

        InscriptionEquipeTournoi result = inscriptionService.validate(1L);

        assertNotNull(result);
        assertEquals("VALIDEE", inscription.getEtat());
        // Verify that the tournament was automatically closed
        verify(tournoiService).closeRegistrations(tournoi.getId());
    }

    @Test
    void refuse_shouldChangeStateToRefusee() {
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepository.save(any(InscriptionEquipeTournoi.class))).thenReturn(inscription);

        InscriptionEquipeTournoi result = inscriptionService.refuse(1L);

        assertNotNull(result);
        assertEquals("REFUSEE", inscription.getEtat());
    }

    @Test
    void cancel_shouldReturnNullIfTournamentAlreadyStarted() {
        inscription.setEtat("VALIDEE");
        tournoi.setEtat("EN_COURS");
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));

        InscriptionEquipeTournoi result = inscriptionService.cancel(1L);
        assertNull(result);
    }

    @Test
    void cancel_shouldChangeStateToAnnulee() {
        inscription.setEtat("VALIDEE");
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepository.save(any(InscriptionEquipeTournoi.class))).thenReturn(inscription);

        InscriptionEquipeTournoi result = inscriptionService.cancel(1L);

        assertNotNull(result);
        assertEquals("ANNULEE", inscription.getEtat());
    }

    @Test
    void refuseAllPending_shouldUpdateAllPendingToRefused() {
        when(inscriptionRepository.findByTournoiAndEtat(tournoi, "EN_ATTENTE"))
                .thenReturn(List.of(inscription));

        inscriptionService.refuseAllPending(tournoi);

        assertEquals("REFUSEE", inscription.getEtat());
        verify(inscriptionRepository).saveAll(any());
    }

    @Test
    void reopen_shouldChangeStateToEnAttente() {
        inscription.setEtat("REFUSEE");
        when(inscriptionRepository.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepository.save(any(InscriptionEquipeTournoi.class))).thenReturn(inscription);

        InscriptionEquipeTournoi result = inscriptionService.reopen(1L);

        assertNotNull(result);
        assertEquals("EN_ATTENTE", inscription.getEtat());
    }
}