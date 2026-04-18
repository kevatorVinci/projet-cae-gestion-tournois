package be.vinci.ipl.cae.demo.services;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import be.vinci.ipl.cae.demo.repositories.InscriptionEquipeTournoiRepository;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;

/**
 * Unit tests for MatchService.
 */
@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

  @Mock
  private MatchRepository matchRepository;

  @Mock
  private TournamentRepository tournamentRepository;

  @Mock
  private InscriptionEquipeTournoiRepository inscriptionRepository;

  @InjectMocks
  private MatchService service;
}