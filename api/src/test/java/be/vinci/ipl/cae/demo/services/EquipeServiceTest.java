package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import java.util.Arrays;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EquipeServiceTest {

  @Mock private EquipeRepository equipeRepository;

  @InjectMocks private EquipeService equipeService;

  // -------------------------------
  // getAllEquipes()
  // -------------------------------
  @Test
  void getAllEquipes_ReturnsAllTeams() {
    // Arrange
    Equipe equipe1 = new Equipe();
    equipe1.setId(1L);
    equipe1.setName("Alpha");

    Equipe equipe2 = new Equipe();
    equipe2.setId(2L);
    equipe2.setName("Beta");

    when(equipeRepository.findAll()).thenReturn(Arrays.asList(equipe1, equipe2));

    // Act
    Iterable<Equipe> result = equipeService.getAllEquipes();

    // Assert
    assertNotNull(result);
    assertEquals(Arrays.asList(equipe1, equipe2), result);
    verify(equipeRepository, times(1)).findAll();
  }

  // -------------------------------
  // getEquipeById()
  // -------------------------------
  @Test
  void getEquipeById_ReturnsEquipeWhenExists() {
    // Arrange
    Equipe equipe = new Equipe();
    equipe.setId(1L);
    equipe.setName("Alpha");

    when(equipeRepository.findById(1L)).thenReturn(Optional.of(equipe));

    // Act
    Optional<Equipe> result = equipeService.getEquipeById(1L);

    // Assert
    assertTrue(result.isPresent());
    assertEquals("Alpha", result.get().getName());
    verify(equipeRepository, times(1)).findById(1L);
  }

  @Test
  void getEquipeById_ReturnsEmptyWhenNotFound() {
    // Arrange
    when(equipeRepository.findById(99L)).thenReturn(Optional.empty());

    // Act
    Optional<Equipe> result = equipeService.getEquipeById(99L);

    // Assert
    assertTrue(result.isEmpty());
    verify(equipeRepository, times(1)).findById(99L);
  }
}
