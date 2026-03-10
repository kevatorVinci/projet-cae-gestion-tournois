package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/** Service for user authentication and profile management. */
@Service
public class UserService {

  private static final String JWT_SECRET = "ilovemypizza!";
  private static final long LIFETIME_JWT = 24 * 60 * 60 * 1000;
  private static final Algorithm ALGORITHM = Algorithm.HMAC256(JWT_SECRET);

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  /**
   * Builds the user service.
   *
   * @param passwordEncoder encoder used for password hashing
   * @param userRepository user repository
   * @param notificationService notification service
   */
  public UserService(
      BCryptPasswordEncoder passwordEncoder,
      UserRepository userRepository,
      NotificationService notificationService) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
  }

  /**
   * Fabrique un ticket (Token) pour permettre au joueur de naviguer sur le site. Il récupère aussi
   * la photo et la spécialité pour les afficher.
   */
  public AuthenticatedUser createJwtToken(String email) {
    // 1. On cherche le joueur dans la base de données grâce à son email
    User user = userRepository.findByEmail(email);

    // 2. On crée le ticket secret (le Token)
    String token =
        JWT.create()
            .withIssuer("auth0")
            .withClaim("email", email)
            .withIssuedAt(new Date())
            .withExpiresAt(new Date(System.currentTimeMillis() + LIFETIME_JWT))
            .sign(ALGORITHM);

    // 3. On prépare le colis final à renvoyer à React
    AuthenticatedUser authenticatedUser = new AuthenticatedUser();
    authenticatedUser.setEmail(email);
    authenticatedUser.setToken(token);

    // 4. Si le joueur existe, on ajoute ses informations visuelles dans le colis
    if (user != null) {
      authenticatedUser.setTag(user.getTag());
      authenticatedUser.setSpecialty(user.getSpecialty());
      authenticatedUser.setProfileImage(user.getProfileImageUrl());
    }

    return authenticatedUser;
  }

  /**
   * Verify and decode a JWT token.
   *
   * @param token JWT token
   * @return user email when token is valid, otherwise null
   */
  public String verifyJwtToken(String token) {
    try {
      return JWT.require(ALGORITHM).build().verify(token).getClaim("email").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /** Vérifie si le mot de passe est bon quand un joueur essaie de se connecter. */
  public AuthenticatedUser login(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      return null;
    }
    if (!passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }
    // ✨ CORRECTION ICI : On donne seulement l'email, pas l'objet complet !
    return createJwtToken(email);
  }

  /** Inscrit un tout nouveau joueur dans la base de données. */
  public AuthenticatedUser register(Credentials credentials) {
    User user = userRepository.findByEmail(credentials.getEmail());
    if (user != null) {
      return null;
    }
    User newUser = createOne(credentials);
    // ✨ CORRECTION ICI : On donne l'email du nouveau joueur au lieu du joueur entier !
    return createJwtToken(newUser.getEmail());
  }

  /**
   * Read a user by email.
   *
   * @param email user email
   * @return user or null
   */
  public User readOneFromEmail(String email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Get a user by id.
   *
   * @param id user id
   * @return optional user
   */
  public Optional<User> getById(Long id) {
    return userRepository.findById(id);
  }

  /**
   * Create a new user.
   *
   * <p>infos de React.
   */
  public User createOne(Credentials credentials) {
    // On cache le mot de passe pour la sécurité
    String hashedPassword = passwordEncoder.encode(credentials.getPassword());

    User user = new User();
    user.setEmail(credentials.getEmail());
    user.setPassword(hashedPassword);

    // On lie les données reçues de React (spécialité, image, etc.)
    user.setTag(credentials.getTag() != null ? credentials.getTag() : "");
    user.setSpecialty(credentials.getSpecialty() != null ? credentials.getSpecialty() : "");
    user.setProfileImageUrl(
        credentials.getProfileImage() != null ? credentials.getProfileImage() : "");

    // On note la date/heure actuelle comme date d'inscription
    user.setDateCreationProfil(LocalDateTime.now());

    // On sauvegarde définitivement !
    User savedUser = userRepository.save(user);
    notificationService.notifierCreationCompte(savedUser);
    return savedUser;
  }

  /** Met à jour les informations visuelles du joueur (Photo, Spécialité et Mot de passe). */
  public AuthenticatedUser updateProfile(
      String email, String specialty, String profileImage, String oldPassword, String newPassword) {
    // 1. On retrouve le joueur grâce à son email
    User user = userRepository.findByEmail(email);

    if (user != null) {
      // 2. On change sa spécialité et sa photo
      user.setSpecialty(specialty);
      user.setProfileImageUrl(profileImage);

      // 3. On vérifie s'il veut changer de mot de passe
      if (oldPassword != null
          && !oldPassword.isBlank()
          && newPassword != null
          && !newPassword.isBlank()) {
        // On vérifie que son ancien mot de passe est correct
        if (passwordEncoder.matches(oldPassword, user.getPassword())) {
          // Si oui, on crypte et on sauvegarde le nouveau
          user.setPassword(passwordEncoder.encode(newPassword));
        } else {
          // Si l'ancien mot de passe est faux, on bloque et on renvoie null
          return null;
        }
      }

      // 4. On sauvegarde les changements
      userRepository.save(user);
      // 5. On renvoie un nouveau ticket à React
      return createJwtToken(email);
    }
    return null;
  }
}
