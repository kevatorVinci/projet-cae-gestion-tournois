package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.time.LocalDate;
import java.util.Date;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private static final String JWT_SECRET = "ilovemypizza!";
  private static final long LIFETIME_JWT = 24 * 60 * 60 * 1000;
  private static final Algorithm ALGORITHM = Algorithm.HMAC256(JWT_SECRET);

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;

  public UserService(BCryptPasswordEncoder passwordEncoder, UserRepository userRepository) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
  }

  /**
   * Fabrique un ticket (Token) pour permettre au joueur de naviguer sur le site.
   * Il récupère aussi la photo et la spécialité pour les afficher.
   */
  public AuthenticatedUser createJwtToken(String email) {
    // 1. On cherche le joueur dans la base de données grâce à son email
    User user = userRepository.findByEmail(email);

    // 2. On crée le ticket secret (le Token)
    String token = JWT.create()
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
      authenticatedUser.setAdmin(user.isAdmin());
    }

    return authenticatedUser;
  }

  public String verifyJwtToken(String token) {
    try {
      return JWT.require(ALGORITHM).build().verify(token).getClaim("email").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Vérifie si le mot de passe est bon quand un joueur essaie de se connecter.
   */
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

  /**
   * Inscrit un tout nouveau joueur dans la base de données.
   */
  public AuthenticatedUser register(Credentials credentials) {
    User user = userRepository.findByEmail(credentials.getEmail());
    if (user != null) {
      return null;
    }
    User newUser = createOne(credentials);
    return createJwtToken(newUser.getEmail());
  }

  public User readOneFromEmail(String email) {
    return userRepository.findByEmail(email);
  }

  public User createOne(Credentials credentials) {
    User user = new User();
    user.setEmail(credentials.getEmail());
    user.setPassword(passwordEncoder.encode(credentials.getPassword()));

    user.setTag(credentials.getTag());
    user.setSpecialty(credentials.getSpecialty());
    user.setProfileImageUrl(credentials.getProfileImage());

    return userRepository.save(user);
  }

  /**
   * Met à jour les informations visuelles du joueur (Photo, Spécialité et Mot de passe).
   */
  public AuthenticatedUser updateProfile(String email, String specialty, String profileImage, String oldPassword, String newPassword) {
    // 1. On retrouve le joueur grâce à son email
    User user = userRepository.findByEmail(email);

    if (user != null) {
      // 2. On change sa spécialité et sa photo
      user.setSpecialty(specialty);
      user.setProfileImageUrl(profileImage);

      // 3. On vérifie s'il veut changer de mot de passe
      if (oldPassword != null && !oldPassword.isBlank() && newPassword != null && !newPassword.isBlank()) {
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

  public java.util.List<AuthenticatedUser> getAllUsersForAdmin() {
    java.util.List<AuthenticatedUser> usersList = new java.util.ArrayList<>();

    Iterable<User> users = userRepository.findAll();

    for (User user : users) {
      AuthenticatedUser dto = new AuthenticatedUser();
      dto.setEmail(user.getEmail());
      dto.setTag(user.getTag());
      dto.setSpecialty(user.getSpecialty());
      dto.setProfileImage(user.getProfileImageUrl());
      dto.setAdmin(user.isAdmin());

      usersList.add(dto);
    }
    return usersList;
  }

  public void addAdmin(String email) {
    // 1. On cherche le joueur
    be.vinci.ipl.cae.demo.models.entities.User user = userRepository.findByEmail(email);
    if (user != null) {
      // 2. On change son rôle
      user.setAdmin(true);
      // 3. On sauvegarde la modification dans la base de données
      userRepository.save(user);
    }
  }

  public void removeAdmin(String email) {
    be.vinci.ipl.cae.demo.models.entities.User user = userRepository.findByEmail(email);
    if (user != null) {
      user.setAdmin(false);
      userRepository.save(user);
    }
  }
}