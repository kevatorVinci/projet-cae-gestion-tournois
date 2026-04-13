package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  private static final String EMAIL = "alice@vinci.be";
  private static final String PASSWORD = "password123";
  private static final String HASHED = "$2a$10$hashedpassword";

  @Mock
  private UserRepository userRepository;
  @Mock
  private TeamRepository teamRepository;
  @Mock
  private BCryptPasswordEncoder passwordEncoder;
  @Mock
  private NotificationService notificationService;
  @Mock
  private UserMapper userMapper;

  @InjectMocks
  private UserService userService;

  private User user;
  private Credentials credentials;

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

  @Test
  void register_newMember_OK() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(null);
    when(passwordEncoder.encode(PASSWORD)).thenReturn(HASHED);
    when(userRepository.save(any())).thenReturn(user);

    AuthenticatedUser result = userService.register(credentials);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
    verify(userRepository).save(any());
  }

  @Test
  void register_hashedPassword_notStoredInPlain() {
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

  @Test
  void login_correctCredentials_returnsToken() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(passwordEncoder.matches(PASSWORD, HASHED)).thenReturn(true);

    AuthenticatedUser result = userService.login(EMAIL, PASSWORD);

    assertNotNull(result);
    assertEquals(EMAIL, result.getEmail());
    assertNotNull(result.getToken());
  }

  @Test
  void createJwtToken_includesPublicData() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result = userService.createJwtToken(EMAIL);

    assertEquals("AliceTag", result.getTag());
    assertEquals("tactician", result.getSpecialty());
  }

  @Test
  void verifyJwtToken_validToken_returnsEmail() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    String token = userService.createJwtToken(EMAIL).getToken();

    assertEquals(EMAIL, userService.verifyJwtToken(token));
  }

  @Test
  void updateProfile_specialtyAndImage_OK() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);

    AuthenticatedUser result =
            userService.updateProfile(EMAIL, "goalkeeper", "avatar2.png", null, null);

    assertNotNull(result);
    assertEquals("goalkeeper", user.getSpecialty());
    assertEquals("avatar2.png", user.getProfileImageUrl());
    verify(userRepository).save(user);
  }

  @Test
  void banUser_existingUser_activatesSoftBan() {
    when(userRepository.findByEmail(EMAIL)).thenReturn(user);
    when(teamRepository.findByPrimaryResponsibleIdOrSecondaryResponsibleId(1L, 1L))
            .thenReturn(Optional.empty());

    userService.banUser(EMAIL, null);

    assertTrue(user.isBanned());
    verify(userRepository).save(user);
  }

  @Test
  void banUser_primaryResponsible_withSecondary_promotesSecondary() {
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

  @Test
  void banUser_primaryResponsibleWithoutSecondary_picksOldestMember() {
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

  @Test
  void banUser_member_isRemovedFromTeam() {
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