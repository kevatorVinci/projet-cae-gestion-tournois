package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.mappers.UserMapper;
import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user authentication and profile management.
 */
@Service
public class UserService {

  /**
   * Secret key used to sign JWT tokens.
   */
  private static final String JWT_SECRET = "ilovemypizza!";

  /**
   * Token lifetime set to 24 hours in milliseconds.
   */
  private static final long LIFETIME_JWT = 24 * 60 * 60 * 1000;

  /**
   * Algorithm used for JWT signing.
   */
  private static final Algorithm ALGORITHM = Algorithm.HMAC256(JWT_SECRET);

  /**
   * Encoder for password security.
   */
  private final BCryptPasswordEncoder passwordEncoder;

  /**
   * Repository for user data.
   */
  private final UserRepository userRepository;

  /**
   * Repository for team data.
   */
  private final TeamRepository teamRepository;

  /**
   * Service for user notifications.
   */
  private final NotificationService notificationService;

  /**
   * Mapper for user DTO conversions.
   */
  private final UserMapper userMapper;

  /**
   * Builds the user service.
   *
   * @param passwordEncoder     encoder used for password hashing.
   * @param userRepository      user repository.
   * @param teamRepository      team repository.
   * @param notificationService notification service.
   * @param userMapper          user mapper.
   */
  public UserService(
      BCryptPasswordEncoder passwordEncoder,
      UserRepository userRepository,
      TeamRepository teamRepository,
      NotificationService notificationService,
      UserMapper userMapper) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
    this.teamRepository = teamRepository;
    this.notificationService = notificationService;
    this.userMapper = userMapper;
  }

  /**
   * Builds a JWT token that allows the player to navigate the application.
   *
   * @param email user email.
   * @return authenticated user payload.
   */
  public AuthenticatedUser createJwtToken(String email) {
    User user = userRepository.findByEmail(email);

    var tokenBuilder = JWT.create()
        .withIssuer("auth0")
        .withClaim("email", email)
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + LIFETIME_JWT));

    if (user != null && user.getId() != null) {
      tokenBuilder = tokenBuilder
          .withSubject(String.valueOf(user.getId()))
          .withClaim("id", user.getId());
    }

    String token = tokenBuilder.sign(ALGORITHM);
    AuthenticatedUser authenticatedUser = userMapper.toAuthenticatedUser(user, token);

    if (authenticatedUser.getEmail() == null) {
      authenticatedUser.setEmail(email);
    }
    return authenticatedUser;
  }

  /**
   * Verify and decode a JWT token.
   *
   * @param token JWT token.
   * @return user email when token is valid, otherwise null.
   */
  public String verifyJwtToken(String token) {
    try {
      return JWT.require(ALGORITHM).build().verify(token).getClaim("email").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Verifies user credentials when a player attempts to log in.
   *
   * @param email    user email.
   * @param password plain-text password.
   * @return authenticated user payload or null.
   */
  public AuthenticatedUser login(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      return null;
    }
    if (user.isBanned()) {
      return null;
    }
    if (!passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }
    return createJwtToken(email);
  }

  /**
   * Registers a brand-new player in the database.
   *
   * @param credentials credentials provided by the user.
   * @return authenticated user payload or null.
   */
  public AuthenticatedUser register(Credentials credentials) {
    User user = userRepository.findByEmail(credentials.getEmail());
    if (user != null) {
      return null;
    }
    User newUser = createOne(credentials);
    return createJwtToken(newUser.getEmail());
  }

  /**
   * Read a user by email.
   *
   * @param email user email.
   * @return user or null.
   */
  public User readOneFromEmail(String email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Creates a user entity from credentials.
   *
   * @param credentials input data.
   * @return saved user.
   */
  public User createOne(Credentials credentials) {
    User user = new User();
    user.setEmail(credentials.getEmail());
    user.setPassword(passwordEncoder.encode(credentials.getPassword()));

    user.setTag(credentials.getTag());
    user.setSpecialty(credentials.getSpecialty());
    user.setProfileImageUrl(credentials.getProfileImage());

    user.setCreationDate(java.time.LocalDate.now());
    user.setProfileCreationDate(LocalDateTime.now());

    User savedUser = userRepository.save(user);
    notificationService.notifyAccountCreation(savedUser);
    return savedUser;
  }

  /**
   * Updates a player's profile display data.
   *
   * @param email        player email.
   * @param specialty    updated specialty.
   * @param profileImage updated image.
   * @param oldPassword  current password.
   * @param newPassword  new password.
   * @return updated authenticated user payload or null.
   */
  public AuthenticatedUser updateProfile(
      String email,
      String specialty,
      String profileImage,
      String oldPassword,
      String newPassword) {

    User user = userRepository.findByEmail(email);

    if (user != null) {
      user.setSpecialty(specialty);
      user.setProfileImageUrl(profileImage);

      if (oldPassword != null
          && !oldPassword.isBlank()
          && newPassword != null
          && !newPassword.isBlank()) {
        if (passwordEncoder.matches(oldPassword, user.getPassword())) {
          user.setPassword(passwordEncoder.encode(newPassword));
        } else {
          return null;
        }
      }

      userRepository.save(user);
      return createJwtToken(email);
    }
    return null;
  }

  /**
   * Gets all users for the admin panel.
   *
   * @return list of users.
   */
  public List<AuthenticatedUser> getAllUsersForAdmin() {
    return userMapper.toAuthenticatedUsers(userRepository.findAll());
  }

  /**
   * Grants admin role to a user.
   *
   * @param email user email.
   */
  public void addAdmin(String email) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      user.setAdmin(true);
      userRepository.save(user);
    }
  }

  /**
   * Revokes admin role from a user.
   *
   * @param email user email.
   */
  public void removeAdmin(String email) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      user.setAdmin(false);
      userRepository.save(user);
    }
  }

  /**
   * Soft-bans a user from the platform with an optional reason.
   *
   * @param email  email of the user to ban.
   * @param reason optional reason for the ban.
   */
  @Transactional
  public void banUser(String email, String reason) {
    if (email == null || email.isBlank()) {
      return;
    }

    User user = userRepository.findByEmail(email);
    if (user == null) {
      return;
    }

    detachUserFromTeamAndReassignResponsibilitiesIfNeeded(user);
    user.setBanned(true);
    if (reason != null && !reason.isBlank()) {
      user.setBanReason(reason.trim());
    }
    userRepository.save(user);
  }

  /**
   * Logic to handle team reassignments when a user is banned.
   *
   * @param user the user being banned.
   */
  private void detachUserFromTeamAndReassignResponsibilitiesIfNeeded(User user) {
    if (user.getId() == null) {
      return;
    }

    Team team = teamRepository
        .findByPrimaryResponsibleIdOrSecondaryResponsibleId(user.getId(), user.getId())
        .orElse(user.getTeam());

    if (team == null) {
      return;
    }

    Long bannedUserId = user.getId();

    boolean wasPrimary = team.getPrimaryResponsible() != null
        && team.getPrimaryResponsible().getId().equals(bannedUserId);
    boolean wasSecondary = team.getSecondaryResponsible() != null
        && team.getSecondaryResponsible().getId().equals(bannedUserId);

    if (wasPrimary) {
      team.setPrimaryResponsible(null);
    }
    if (wasSecondary) {
      team.setSecondaryResponsible(null);
    }

    if (team.getPrimaryResponsible() == null && team.getSecondaryResponsible() != null) {
      User secondary = team.getSecondaryResponsible();
      if (!secondary.isBanned() && !secondary.getId().equals(bannedUserId)) {
        team.setPrimaryResponsible(secondary);
      }
      team.setSecondaryResponsible(null);
    }

    if (team.getPrimaryResponsible() == null) {
      User replacement = team.getMembers().stream()
          .filter(member -> member.getId() != null)
          .filter(member -> !member.getId().equals(bannedUserId))
          .filter(member -> !member.isBanned())
          .min(
              Comparator.comparing(
                  User::getCreationDate,
                  Comparator.nullsLast(Comparator.naturalOrder())
              ).thenComparing(
                  User::getId,
                  Comparator.nullsLast(Long::compareTo)
              )
          )
          .orElse(null);

      team.setPrimaryResponsible(replacement);
    }

    team.getMembers().removeIf(
        member -> member.getId() != null && member.getId().equals(bannedUserId)
    );
    user.setTeam(null);

    teamRepository.save(team);
  }

  /**
   * Gets a user by ID.
   *
   * @param id unique identifier.
   * @return optional containing the user.
   */
  public Optional<User> getById(Long id) {
    return userRepository.findById(id);
  }
}