package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.time.LocalDate;
import java.util.Date;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * User service.
 */
@Service
public class UserService {

  private static final String JWT_SECRET = "ilovemypizza!";
  private static final long LIFETIME_JWT = 24 * 60 * 60 * 1000;
  private static final Algorithm ALGORITHM = Algorithm.HMAC256(JWT_SECRET);

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;

  /**
   * Constructor.
   *
   * @param passwordEncoder the password encoder
   * @param userRepository  the user repository
   */
  public UserService(BCryptPasswordEncoder passwordEncoder, UserRepository userRepository) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
  }

  /**
   * Create a JWT token.
   *
   * @param email the email to include in the claim
   * @return the authenticated user with JWT token
   */
  public AuthenticatedUser createJwtToken(String email) {
    String token = JWT.create()
        .withIssuer("auth0")
        .withClaim("email", email)
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + LIFETIME_JWT))
        .sign(ALGORITHM);
    AuthenticatedUser authenticatedUser = new AuthenticatedUser();
    authenticatedUser.setEmail(email);
    authenticatedUser.setToken(token);
    return authenticatedUser;
  }

  /**
   * Verify a JWT token.
   *
   * @param token the token to verify
   * @return the email if the token is valid, null otherwise
   */
  public String verifyJwtToken(String token) {
    try {
      return JWT.require(ALGORITHM).build().verify(token).getClaim("email").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Login a user.
   *
   * @param email    the email
   * @param password the password
   * @return the authenticated user or null if credentials are invalid
   */
  public AuthenticatedUser login(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      return null;
    }
    if (!passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }
    return createJwtToken(email);
  }

  /**
   * Register a new user.
   *
   * @param email    the email
   * @param password the password
   * @return the authenticated user or null if email already exists
   */
  public AuthenticatedUser register(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      return null;
    }
    createOne(email, password);
    return createJwtToken(email);
  }

  /**
   * Read a user from its email.
   *
   * @param email the email
   * @return the user or null if not found
   */
  public User readOneFromEmail(String email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Create a new user.
   *
   * @param email    the email
   * @param password the password
   */
  public void createOne(String email, String password) {
    String hashedPassword = passwordEncoder.encode(password);
    User user = new User();
    user.setEmail(email);
    user.setPassword(hashedPassword);
    user.setTag("");
    user.setSpecialty("");
    user.setProfileImageUrl("");
    user.setCreationDate(LocalDate.now());
    userRepository.save(user);
  }
}