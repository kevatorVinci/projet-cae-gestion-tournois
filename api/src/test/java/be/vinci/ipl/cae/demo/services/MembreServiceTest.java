package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.Membre;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.MembreRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MembreServiceTest {

  @Mock
  private MembreRepository membreRepository;

  @Mock
  private EquipeRepository equipeRepository;

  @InjectMocks
  private MembreService membreService;

  // -------------------------------
  // getById()
  // -------------------------------
  @Test
  void getById_ReturnsMember() {
    Membre membre = new Membre();
    membre.setId(1L);

    when(membreRepository.findById(1L)).thenReturn(Optional.of(membre));

    Optional<Membre> result = membreService.getById(1L);

    assertTrue(result.isPresent());
    assertEquals(1L, result.get().getId());
  }

  // -------------------------------
  // creerEquipe()
  // -------------------------------
  @Test
  void creerEquipe_Success() {
    Membre membre = new Membre();
    membre.setId(1L);

    when(equipeRepository.existsByName("Alpha")).thenReturn(false);
    when(membreRepository.save(membre)).thenReturn(membre);

    Equipe equipeCreee = new Equipe();
    equipeCreee.setName("Alpha");
    when(equipeRepository.save(any(Equipe.class))).thenReturn(equipeCreee);

    Equipe result = membreService.creerEquipe(membre, "Alpha");

    assertNotNull(result);
    assertEquals("Alpha", result.getName());
    verify(equipeRepository, times(1)).save(any(Equipe.class));
  }

  @Test
  void creerEquipe_FailsWhenMemberAlreadyInTeam() {
    Membre membre = new Membre();
    membre.setEquipe(new Equipe()); // déjà dans une équipe

    assertThrows(IllegalStateException.class,
        () -> membreService.creerEquipe(membre, "Alpha"));
  }

  @Test
  void creerEquipe_FailsWhenNameAlreadyExists() {
    Membre membre = new Membre();

    when(equipeRepository.existsByName("Alpha")).thenReturn(true);

    Equipe result = membreService.creerEquipe(membre, "Alpha");

    assertNull(result);
    verify(equipeRepository, never()).save(any());
  }

  // -------------------------------
  // demanderRejoindreEquipe()
  // -------------------------------
  @Test
  void demanderRejoindreEquipe_Success() {
    Membre membre = new Membre();
    membre.setId(1L);

    Equipe equipe = new Equipe();
    equipe.setId(10L);

    when(equipeRepository.findById(10L)).thenReturn(Optional.of(equipe));

    membreService.demanderRejoindreEquipe(membre, 10L);

    assertEquals(equipe, membre.getEquipe());
    assertTrue(equipe.getMembres().contains(membre));
    verify(membreRepository, times(1)).save(membre);
    verify(equipeRepository, times(1)).save(equipe);
  }

  @Test
  void demanderRejoindreEquipe_FailsWhenMemberAlreadyInTeam() {
    Membre membre = new Membre();
    membre.setEquipe(new Equipe()); // déjà dans une équipe

    assertThrows(IllegalStateException.class,
        () -> membreService.demanderRejoindreEquipe(membre, 10L));
  }

  @Test
  void demanderRejoindreEquipe_FailsWhenTeamNotFound() {
    Membre membre = new Membre();

    when(equipeRepository.findById(10L)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class,
        () -> membreService.demanderRejoindreEquipe(membre, 10L));
  }
}
