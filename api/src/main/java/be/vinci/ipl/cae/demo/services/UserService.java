package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.util.Date;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for user operations and JWT management.
 */
@Service
public class UserService {

  private static final String jwtSecret = "ilovemypizza!";
  private static final long lifetimeJwt = 24 * 60 * 60 * 1000; // 24 hours

  private static final Algorithm algorithm = Algorithm.HMAC256(jwtSecret);

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;

  /**
   * Constructor for UserService.
   *
   * @param passwordEncoder the BCrypt password encoder.
   * @param userRepository  the user repository.
   */
  public UserService(BCryptPasswordEncoder passwordEncoder, UserRepository userRepository) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
  }

  /**
   * Creates a signed JWT token for the given username.
   *
   * @param username the username.
   * @return the authenticated user with a JWT token.
   */
  public AuthenticatedUser createJwtToken(String username) {
    String token = JWT.create()
        .withIssuer("auth0")
        .withClaim("username", username)
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + lifetimeJwt))
        .sign(algorithm);

    AuthenticatedUser authenticatedUser = new AuthenticatedUser();
    authenticatedUser.setUsername(username);
    authenticatedUser.setToken(token);

    return authenticatedUser;
  }

  /**
   * Verifies a JWT token and returns the username if valid.
   *
   * @param token the JWT token to verify.
   * @return the username or null if token is invalid.
   */
  public String verifyJwtToken(String token) {
    try {
      return JWT.require(algorithm).build().verify(token).getClaim("username").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Logs in a user with the given credentials.
   *
   * @param username the username.
   * @param password the plain text password.
   * @return the authenticated user or null if credentials are invalid.
   */
  public AuthenticatedUser login(String username, String password) {
    User user = userRepository.findByUsername(username);
    if (user == null) {
      return null;
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }

    System.out.println(createJwtToken(username));

    return createJwtToken(username);
  }

  /**
   * Registers a new user.
   *
   * @param username the username.
   * @param password the plain text password.
   * @return the authenticated user or null if username already exists.
   */
  public AuthenticatedUser register(String username, String password) {
    User user = userRepository.findByUsername(username);
    if (user != null) {
      return null;
    }

    createOne(username, password);

    return createJwtToken(username);
  }

  /**
   * Returns a user by username.
   *
   * @param username the username.
   * @return the user or null if not found.
   */
  public User readOneFromUsername(String username) {
    return userRepository.findByUsername(username);
  }

  /**
   * Creates and saves a new user with a hashed password.
   *
   * @param username the username.
   * @param password the plain text password.
   */
  public void createOne(String username, String password) {
    String hashedPassword = passwordEncoder.encode(password);

    User user = new User();
    user.setUsername(username);
    user.setPassword(hashedPassword);

    userRepository.save(user);
  }

}
