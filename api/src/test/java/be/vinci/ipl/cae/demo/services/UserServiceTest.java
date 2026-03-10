package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private BCryptPasswordEncoder passwordEncoder;
  @Mock private NotificationService notificationService;

  @InjectMocks private UserService userService;

  private User user;
  private Credentials credentials;

  private static final String EMAIL = "alice@vinci.be";
  private static final String PASSWORD = "password123";
  private static final String HASHED = "$2a$10$hashedpassword";

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(1L);
    user.setEmail(EMAIL);
    user.setPassword(HASHED);
    user.setTag("AliceTag");
    user.setSpecialty("tacticien");
    user.setProfileImageUrl("avatar1.png");

    credentials = new Credentials();
    credentials.setEmail(EMAIL);
    credentials.setPassword(PASSWORD);
    credentials.setTag("AliceTag");
    credentials.setSpecialty("tacticien");
  }

  // ═══════════════════════════════════════════════════════════════════
  // register
  // Règle : email utilisé comme login, unique par membre (Énoncé p.2)
  // Règle : mot de passe stocké hashé (BCrypt)
  // Données obligatoires : email, mdp, tag, spécialité (Énoncé p.2)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void register_nouveauMembre_OK() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(null);
    when(passwordEncoder.encode(PASSWORD)).thenReturn(HASHED);
    when(userRepository.save(any())).thenReturn(user);

    AuthenticatedUser result = userService.register(credentials);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
    verify(userRepository).save(any()); // membre bien sauvegardé
  }

  @Test
  void register_motDePasseHashe_pasStockeEnClair() {
    // Règle de sécurité : le mot de passe ne doit jamais être stocké en clair
    when(userRepository.findByEmail(EMAIL)).thenReturn(null);
    when(passwordEncoder.encode(PASSWORD)).thenReturn(HASHED);
    when(userRepository.save(any()))
        .thenAnswer(
            inv -> {
              User saved = inv.getArgument(0);
              assertNotEquals(PASSWORD, saved.getPassword()); // pas en clair !
              return saved;
            });

    userService.register(credentials);

    verify(passwordEncoder).encode(PASSWORD);
  }

  @Test
  void register_emailDejaUtilise_retourneNull() {
    // Règle : email unique comme login (Énoncé p.2)
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.register(credentials);

    assertNull(result);
    verify(userRepository, never()).save(any());
  }

  // ═══════════════════════════════════════════════════════════════════
  // login
  // Règle : connexion par email + mot de passe (Énoncé p.2)
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void login_credentialsCorrects_retourneToken() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches(PASSWORD, HASHED)).thenReturn(true);

    AuthenticatedUser result = userService.login(EMAIL, PASSWORD);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
  }

  @Test
  void login_emailInconnu_retourneNull() {
    when(userRepository.findByEmail("inconnu@vinci.be")).thenReturn(null);

    assertNull(userService.login("inconnu@vinci.be", PASSWORD));
  }

  @Test
  void login_mauvaisMotDePasse_retourneNull() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches("mauvais", HASHED)).thenReturn(false);

    assertNull(userService.login(EMAIL, "mauvais"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // createJwtToken
  // Règle : le token contient l'email pour identifier le membre
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void createJwtToken_retourneTokenNonVide() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.createJwtToken(EMAIL);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
    assertFalse(result.getToken().isBlank());
  }

  @Test
  void createJwtToken_inclutDonneesPubliques() {
    // Règle : tag et spécialité sont des données publiques (PrécisionsV1 p.3)
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.createJwtToken(EMAIL);

    assertEquals("AliceTag", result.getTag());
    assertEquals("tacticien", result.getSpecialty());
  }

  @Test
  void createJwtToken_emailPasExposeDansLesChamps() {
    // Règle : l'email est une donnée PRIVÉE (PrécisionsV1 p.3)
    // On vérifie qu'il n'est pas stocké dans un champ public inattendu
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.createJwtToken(EMAIL);

    // L'email est bien présent dans le token pour l'auth, mais pas exposé autrement
    assertEquals(EMAIL, result.getEmail());
    // Le tag ne doit pas contenir l'email
    assertNotEquals(EMAIL, result.getTag());
  }

  // ═══════════════════════════════════════════════════════════════════
  // verifyJwtToken
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void verifyJwtToken_tokenValide_retourneEmail() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    String token = userService.createJwtToken(EMAIL).getToken();

    assertEquals(EMAIL, userService.verifyJwtToken(token));
  }

  @Test
  void verifyJwtToken_tokenInvalide_retourneNull() {
    assertNull(userService.verifyJwtToken("token.invalide.bidon"));
  }

  @Test
  void verifyJwtToken_tokenNull_retourneNull() {
    assertNull(userService.verifyJwtToken(null));
  }

  // ═══════════════════════════════════════════════════════════════════
  // readOneFromEmail
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void readOneFromEmail_utilisateurExistant_retourneUser() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    User result = userService.readOneFromEmail(EMAIL);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
  }

  @Test
  void readOneFromEmail_utilisateurInexistant_retourneNull() {
    when(userRepository.findByEmail("inconnu@vinci.be")).thenReturn(null);

    assertNull(userService.readOneFromEmail("inconnu@vinci.be"));
  }

  // ═══════════════════════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void getById_utilisateurExistant_retourneOptional() {
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    Optional<User> result = userService.getById(1L);

    assertTrue(result.isPresent());
    assertEquals(1L, result.get().getId());
  }

  @Test
  void getById_utilisateurInexistant_retourneEmpty() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    assertTrue(userService.getById(99L).isEmpty());
  }

  // ═══════════════════════════════════════════════════════════════════
  // updateProfile
  // Règle : peut modifier spécialité, image de profil, mot de passe (Énoncé p.3)
  // Règle : changement mdp nécessite l'ancien mdp correct
  // ═══════════════════════════════════════════════════════════════════

  @Test
  void updateProfile_specialiteEtImage_OK() {
    // Règle : membre peut modifier sa spécialité et son image (Énoncé p.3)
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result =
        userService.updateProfile(EMAIL, "gardien", "avatar2.png", null, null);

    assertNotNull(result);
    assertEquals("gardien", user.getSpecialty());
    assertEquals("avatar2.png", user.getProfileImageUrl());
    verify(userRepository).save(user);
  }

  @Test
  void updateProfile_changementMotDePasse_ancienCorrect_OK() {
    // Règle : peut changer son mot de passe depuis l'espace personnel (Énoncé p.3)
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches("oldPass", HASHED)).thenReturn(true);
    when(passwordEncoder.encode("newPass")).thenReturn("$2a$newHash");

    AuthenticatedUser result =
        userService.updateProfile(EMAIL, "gardien", "avatar2.png", "oldPass", "newPass");

    assertNotNull(result);
    assertEquals("$2a$newHash", user.getPassword());
  }

  @Test
  void updateProfile_changementMotDePasse_ancienIncorrect_retourneNull() {
    // Règle : l'ancien mdp doit être correct pour pouvoir le changer
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches("mauvais", HASHED)).thenReturn(false);

    AuthenticatedUser result =
        userService.updateProfile(EMAIL, "gardien", "avatar2.png", "mauvais", "newPass");

    assertNull(result);
    // Le mot de passe ne doit pas avoir changé
    assertEquals(HASHED, user.getPassword());
    verify(userRepository, never()).save(any());
  }

  @Test
  void updateProfile_utilisateurInexistant_retourneNull() {
    when(userRepository.findByEmail("inconnu@vinci.be")).thenReturn(null);

    AuthenticatedUser result =
        userService.updateProfile("inconnu@vinci.be", "gardien", "avatar2.png", null, null);

    assertNull(result);
  }

  @Test
  void updateProfile_nouveauTokenRetourne() {
    // Après update, un nouveau token est généré pour la session React
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result =
        userService.updateProfile(EMAIL, "architecte", "avatar3.png", null, null);

    assertNotNull(result.getToken());
    assertFalse(result.getToken().isBlank());
  }
}
