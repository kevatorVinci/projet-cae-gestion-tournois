package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** AuthController to handle user authentication. */
@RestController
@RequestMapping("/auths")
public class AuthController {

  private final UserService userService;

  /**
   * Constructor for AuthController.
   *
   * @param userService the injected UserService.
   */
  public AuthController(UserService userService) {
    this.userService = userService;
  }

  private boolean isInvalidCredentials(Credentials credentials) {
    return credentials == null
        || credentials.getEmail() == null
        || credentials.getEmail().isBlank()
        || credentials.getPassword() == null
        || credentials.getPassword().isBlank();
  }

  /**
   * Register a new user.
   *
   * @param credentials register payload
   * @return authenticated user with token
   */
  @PostMapping("/register")
  public AuthenticatedUser register(@RequestBody Credentials credentials) {
    if (isInvalidCredentials(credentials)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    // ✨ On lui donne l'objet "credentials" en entier, et plus juste l'email et le mot de passe !
    AuthenticatedUser user = userService.register(credentials);
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT);
    }
    return user;
  }

  /**
   * Authenticate an existing user.
   *
   * @param credentials login payload
   * @return authenticated user with token
   */
  @PostMapping("/login")
  public AuthenticatedUser login(@RequestBody Credentials credentials) {
    if (isInvalidCredentials(credentials)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    AuthenticatedUser user = userService.login(credentials.getEmail(), credentials.getPassword());
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  /**
   * Porte d'entrée pour modifier le profil.
   *
   * @param credentials le colis envoyé par React
   */
  @PutMapping("/update")
  @PreAuthorize("isAuthenticated()")
  public AuthenticatedUser updateProfile(@RequestBody Credentials credentials) {
    AuthenticatedUser user =
        userService.updateProfile(
            credentials.getEmail(),
            credentials.getSpecialty(),
            credentials.getProfileImage(),
            credentials.getOldPassword(),
            credentials.getNewPassword());

    if (user == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Mauvais mot de passe ou utilisateur introuvable");
    }
    return user;
  }

  /**
   * La route (URL) que React va appeler pour obtenir la liste des joueurs.
   */
  @GetMapping("/users")
  @PreAuthorize("isAuthenticated()")
  public java.util.List<AuthenticatedUser> getAllUsers() {
    return userService.getAllUsersForAdmin();
  }

  @PutMapping("/addAdmin")
  @PreAuthorize("isAuthenticated()")
  public void addAdmin(@RequestBody String email) {
    userService.addAdmin(email);
  }

  @PutMapping("/removeAdmin")
  @PreAuthorize("isAuthenticated()")
  public void removeAdmin(@RequestBody String email) {
    userService.removeAdmin(email);
  }
}
