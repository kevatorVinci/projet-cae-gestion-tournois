package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.time.LocalDateTime;
import java.util.Date;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for user authentication and profile management.
 */
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
     * @param passwordEncoder     encoder used for password hashing
     * @param userRepository      user repository
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
     * Fabrique un ticket (Token) pour permettre au joueur de naviguer sur le site.
     *
     * @param email l'email de l'utilisateur
     * @return les infos de l'utilisateur authentifié
     */
    public AuthenticatedUser createJwtToken(String email) {
        User user = userRepository.findByEmail(email);

        var tokenBuilder =
                JWT.create()
                        .withIssuer("auth0")
                        .withClaim("email", email)
                        .withIssuedAt(new Date())
                        .withExpiresAt(new Date(System.currentTimeMillis() + LIFETIME_JWT));

        if (user != null && user.getId() != null) {
            tokenBuilder =
                    tokenBuilder.withSubject(String.valueOf(user.getId())).withClaim("id", user.getId());
        }

        String token = tokenBuilder.sign(ALGORITHM);

        AuthenticatedUser authenticatedUser = new AuthenticatedUser();
        authenticatedUser.setEmail(email);
        authenticatedUser.setToken(token);

        if (user != null) {
            authenticatedUser.setTag(user.getTag());
            authenticatedUser.setSpecialty(user.getSpecialty());
            authenticatedUser.setProfileImage(user.getProfileImageUrl());
            authenticatedUser.setAdmin(user.isAdmin());
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
            String email, String specialty, String profileImage,
            String oldPassword, String newPassword) {
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
     * Récupère un utilisateur par son ID.
     *
     * @param id identifiant unique
     * @return un Optional contenant l'utilisateur
     */
    public java.util.Optional<User> getById(Long id) {
        return userRepository.findById(id);
    }
}
