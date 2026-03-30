package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.mappers.UserMapper;
import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Date;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for user authentication and profile management. */
@Service
public class UserService {

  private static final String JWT_SECRET = "ilovemypizza!";
  private static final long LIFETIME_JWT = 24 * 60 * 60 * 1000;
  private static final Algorithm ALGORITHM = Algorithm.HMAC256(JWT_SECRET);

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final EquipeRepository equipeRepository;
  private final NotificationService notificationService;
  private final UserMapper userMapper;

  /**
   * Builds the user service.
   *
   * @param passwordEncoder     encoder used for password hashing
   * @param userRepository      user repository
   * @param notificationService notification service
   */
  public UserService(
      BCryptPasswordEncoder passwordEncoder,
      UserRepository userRepository,
      EquipeRepository equipeRepository,
      NotificationService notificationService,
      UserMapper userMapper) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
    this.equipeRepository = equipeRepository;
    this.notificationService = notificationService;
    this.userMapper = userMapper;
  }

  /**
   * Fabrique un ticket (Token) pour permettre au joueur de naviguer sur le site.
   *
   * @param email l'email de l'utilisateur
   * @return les infos de l'utilisateur authentifié
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
    return userMapper.toAuthenticatedUser(user, token);
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

  /**
   * Vérifie si le mot de passe est bon quand un joueur essaie de se connecter.
   *
   * @param email    l'email
   * @param password le mot de passe
   * @return l'utilisateur authentifié ou null
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
   * Inscrit un tout nouveau joueur dans la base de données.
   *
   * @param credentials les identifiants fournis
   * @return l'utilisateur authentifié ou null
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
   * @param email user email
   * @return user or null
   */
  public User readOneFromEmail(String email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Crée une entité utilisateur à partir des credentials.
   *
   * @param credentials les données
   * @return l'utilisateur sauvegardé
   */
  public User createOne(Credentials credentials) {
    User user = new User();
    user.setEmail(credentials.getEmail());
    user.setPassword(passwordEncoder.encode(credentials.getPassword()));

    user.setTag(credentials.getTag());
    user.setSpecialty(credentials.getSpecialty());
    user.setProfileImageUrl(credentials.getProfileImage());

    // On note la date/heure actuelle comme date d'inscription
    user.setCreationDate(java.time.LocalDate.now());
    user.setDateCreationProfil(LocalDateTime.now());

    // On sauvegarde définitivement !
    User savedUser = userRepository.save(user);
    notificationService.notifierCreationCompte(savedUser);
    return savedUser;
  }

  /**
   * Met à jour les informations visuelles du joueur.
   *
   * @param email        email du joueur
   * @param specialty    nouvelle spécialité
   * @param profileImage nouvelle image
   * @param oldPassword  ancien mdp
   * @param newPassword  nouveau mdp
   * @return l'utilisateur mis à jour ou null
   */
  public AuthenticatedUser updateProfile(
      String email, String specialty, String profileImage, String oldPassword, String newPassword) {
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
   * Récupère tous les utilisateurs pour le panneau admin.
   *
   * @return la liste des utilisateurs
   */
  public java.util.List<AuthenticatedUser> getAllUsersForAdmin() {
    return userMapper.toAuthenticatedUsers(userRepository.findAll());
  }

  /**
   * Ajoute un administrateur.
   *
   * @param email email de l'utilisateur
   */
  public void addAdmin(String email) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      user.setAdmin(true);
      userRepository.save(user);
    }
  }

  /**
   * Retire un administrateur.
   *
   * @param email email de l'utilisateur
   */
  public void removeAdmin(String email) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      user.setAdmin(false);
      userRepository.save(user);
    }
  }

  /**
   * Soft-bans a user from the platform.
   *
   * @param email email of the user to ban
   */
  @Transactional
  public void banUser(String email) {
    if (email == null || email.isBlank()) {
      return;
    }

    User user = userRepository.findByEmail(email);
    if (user == null) {
      return;
    }

    detachUserFromTeamAndReassignResponsibilitiesIfNeeded(user);
    user.setBanned(true);
    userRepository.save(user);
  }

  private void detachUserFromTeamAndReassignResponsibilitiesIfNeeded(User user) {
    if (user.getId() == null) {
      return;
    }

    Equipe equipe = equipeRepository
        .findByResponsablePrincipalIdOrResponsableSecondaireId(user.getId(), user.getId())
        .orElse(user.getEquipe());

    if (equipe == null) {
      return;
    }

    Long bannedUserId = user.getId();

    boolean wasPrincipal = equipe.getResponsablePrincipal() != null
        && equipe.getResponsablePrincipal().getId().equals(bannedUserId);
    boolean wasSecondaire = equipe.getResponsableSecondaire() != null
        && equipe.getResponsableSecondaire().getId().equals(bannedUserId);

    if (wasPrincipal) {
      equipe.setResponsablePrincipal(null);
    }
    if (wasSecondaire) {
      equipe.setResponsableSecondaire(null);
    }

    if (equipe.getResponsablePrincipal() == null && equipe.getResponsableSecondaire() != null) {
      User secondary = equipe.getResponsableSecondaire();
      if (!secondary.isBanned() && !secondary.getId().equals(bannedUserId)) {
        equipe.setResponsablePrincipal(secondary);
      }
      equipe.setResponsableSecondaire(null);
    }

    if (equipe.getResponsablePrincipal() == null) {
      User replacement = equipe.getMembres().stream()
          .filter(member -> member.getId() != null)
          .filter(member -> !member.getId().equals(bannedUserId))
          .filter(member -> !member.isBanned())
          .min(
              Comparator.comparing(
                  User::getCreationDate,
                  Comparator.nullsLast(Comparator.naturalOrder()))
                  .thenComparing(User::getId, Comparator.nullsLast(Long::compareTo)))
          .orElse(null);

      equipe.setResponsablePrincipal(replacement);
    }

    equipe.getMembres().removeIf(
        member -> member.getId() != null && member.getId().equals(bannedUserId));
    user.setEquipe(null);

    equipeRepository.save(equipe);
  }

  /**
   * Récupère un utilisateur par son ID.
   *
   * @param id identifiant unique
   * @return un Optional contenant l'utilisateur
   */
  public java.util.Optional<User> getById(Long id) {
    return userRepository.findById(id);
  }
}
