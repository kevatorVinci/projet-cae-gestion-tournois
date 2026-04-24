package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import be.vinci.ipl.cae.demo.mappers.UserMapper;
import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Unit tests for UserService using Mockito. */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  private static final String EMAIL = "alice@vinci.be";
  private static final String PASSWORD = "password123";
  private static final String HASHED = "$2a$10$hashedpassword";

  @Mock private UserRepository userRepository;
  @Mock private TeamRepository teamRepository;
  @Mock private BCryptPasswordEncoder passwordEncoder;
  @Mock private NotificationService notificationService;
  @Mock private PlayerSelectionCleanupService playerSelectionCleanupService;
  @Mock private UserMapper userMapper;

  @InjectMocks private UserService userService;

  private User user;
  private Credentials credentials;

  /** Set up mock data before each test. */
  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(1L);
    user.setEmail(EMAIL);
    user.setPassword(HASHED);
    user.setTag("AliceTag");
    user.setSpecialty("tactician");
    user.setProfileImageUrl("avatar1.png");
    user.setCreationDate(LocalDate.of(2026, 1, 1));

    credentials = new Credentials();
    credentials.setEmail(EMAIL);
    credentials.setPassword(PASSWORD);
    credentials.setTag("AliceTag");
    credentials.setSpecialty("tactician");

    lenient()
        .when(userMapper.toAuthenticatedUser(nullable(User.class), anyString()))
        .thenAnswer(
            invocation -> {
              User source = invocation.getArgument(0);
              String token = invocation.getArgument(1);
              AuthenticatedUser dto = new AuthenticatedUser();
              dto.setToken(token);
              if (source != null) {
                dto.setEmail(source.getEmail());
                dto.setTag(source.getTag());
                dto.setSpecialty(source.getSpecialty());
                dto.setProfileImage(source.getProfileImageUrl());
                dto.setAdmin(source.isAdmin());
                dto.setBanned(source.isBanned());
              }
              return dto;
            });
  }

  /** Tests registration of a new member. */
  @Test
  void registerNewMemberOk() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(null);
    when(passwordEncoder.encode(PASSWORD)).thenReturn(HASHED);
    when(userRepository.save(any())).thenReturn(user);

    AuthenticatedUser result = userService.register(credentials);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
    verify(userRepository).save(any());
  }

  /** Verifies that the plain password is not stored directly. */
  @Test
  void registerHashedPasswordNotStoredInPlain() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(null);
    when(passwordEncoder.encode(PASSWORD)).thenReturn(HASHED);
    when(userRepository.save(any()))
        .thenAnswer(
            inv -> {
              User saved = inv.getArgument(0);
              assertNotEquals(PASSWORD, saved.getPassword());
              return saved;
            });

    userService.register(credentials);
    verify(passwordEncoder).encode(PASSWORD);
  }

  /** Tests login with correct credentials. */
  @Test
  void loginCorrectCredentialsReturnsToken() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches(PASSWORD, HASHED)).thenReturn(true);

    AuthenticatedUser result = userService.login(EMAIL, PASSWORD);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
  }

  /** Tests that the JWT token contains public user data. */
  @Test
  void createJwtTokenIncludesPublicData() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.createJwtToken(EMAIL);

    assertEquals("AliceTag", result.getTag());
    assertEquals("tactician", result.getSpecialty());
  }

  /** Tests JWT token verification. */
  @Test
  void verifyJwtTokenValidTokenReturnsEmail() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    String token = userService.createJwtToken(EMAIL).getToken();

    assertEquals(EMAIL, userService.verifyJwtToken(token));
  }

  /** Tests updating the user profile. */
  @Test
  void updateProfileSpecialtyAndImageOk() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    userService.updateProfile(EMAIL, "goalkeeper", "avatar2.png", null, null);

    assertEquals("goalkeeper", user.getSpecialty());
    assertEquals("avatar2.png", user.getProfileImageUrl());
    verify(userRepository).save(user);
  }

  /** Tests banning a simple user. */
  @Test
  void banUserExistingUserActivatesSoftBan() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(teamRepository.findByPrimaryResponsibleIdOrSecondaryResponsibleId(1L, 1L))
        .thenReturn(Optional.empty());

    userService.banUser(EMAIL, null);

    assertTrue(user.isBanned());
    verify(userRepository).save(user);
  }

  /** Tests banning a primary responsible and promoting the secondary. */
  @Test
  void banUserPrimaryResponsibleWithSecondaryPromotesSecondary() {
    User secondary = new User();
    secondary.setId(2L);
    secondary.setCreationDate(LocalDate.of(2026, 1, 2));

    Team team = new Team();
    team.setPrimaryResponsible(user);
    team.setSecondaryResponsible(secondary);
    team.getMembers().add(user);
    team.getMembers().add(secondary);

    user.setTeam(team);

    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(teamRepository.findByPrimaryResponsibleIdOrSecondaryResponsibleId(1L, 1L))
        .thenReturn(Optional.of(team));

    userService.banUser(EMAIL, null);

    assertEquals(secondary, team.getPrimaryResponsible());
    assertNull(team.getSecondaryResponsible());
    assertTrue(user.isBanned());
    assertFalse(team.getMembers().contains(user));
    assertNull(user.getTeam());
    verify(teamRepository).save(team);
    verify(userRepository).save(user);
  }

  /** Tests banning a responsible without a secondary, picking the oldest member. */
  @Test
  void banUserPrimaryResponsibleWithoutSecondaryPicksOldestMember() {
    User oldest = new User();
    oldest.setId(3L);
    oldest.setCreationDate(LocalDate.of(2024, 2, 1));

    User newest = new User();
    newest.setId(4L);
    newest.setCreationDate(LocalDate.of(2025, 5, 1));

    Team team = new Team();
    team.setPrimaryResponsible(user);
    team.getMembers().add(user);
    team.getMembers().add(newest);
    team.getMembers().add(oldest);

    user.setTeam(team);

    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(teamRepository.findByPrimaryResponsibleIdOrSecondaryResponsibleId(1L, 1L))
        .thenReturn(Optional.of(team));

    userService.banUser(EMAIL, null);

    assertEquals(oldest, team.getPrimaryResponsible());
    assertNull(team.getSecondaryResponsible());
    assertFalse(team.getMembers().contains(user));
    assertNull(user.getTeam());
    verify(teamRepository).save(team);
  }

  /** Tests that a banned member is removed from their team. */
  @Test
  void banUserMemberIsRemovedFromTeam() {
    User principal = new User();
    principal.setId(10L);
    principal.setCreationDate(LocalDate.of(2025, 1, 1));

    Team team = new Team();
    team.setPrimaryResponsible(principal);
    team.getMembers().add(principal);
    team.getMembers().add(user);

    user.setTeam(team);

    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(teamRepository.findByPrimaryResponsibleIdOrSecondaryResponsibleId(1L, 1L))
        .thenReturn(Optional.empty());

    userService.banUser(EMAIL, null);

    assertFalse(team.getMembers().contains(user));
    assertNull(user.getTeam());
    verify(teamRepository).save(team);
  }
}
