package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.dtos.UpdateProfileDto;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * AuthController to handle user authentication and profiles.
 */
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

  /**
   * Register a new user.
   *
   * @param credentials register payload.
   * @return authenticated user with token.
   */
  @PostMapping("/register")
  public AuthenticatedUser register(@RequestBody @Valid Credentials credentials) {
    AuthenticatedUser user = userService.register(credentials);
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà utilisé.");
    }
    return user;
  }

  /**
   * Authenticate an existing user.
   *
   * @param credentials login payload.
   * @return authenticated user with token.
   */
  @PostMapping("/login")
  public AuthenticatedUser login(@RequestBody @Valid Credentials credentials) {
    var existingUser = userService.readOneFromEmail(credentials.getEmail());

    // Check if the user is banned before logging them in
    if (existingUser != null && existingUser.isBanned()) {
      String banMessage = "Ce compte est banni.";
      if (existingUser.getBanReason() != null && !existingUser.getBanReason().isBlank()) {
        banMessage += " Raison : " + existingUser.getBanReason();
      }
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, banMessage);
    }

    AuthenticatedUser user = userService.login(
        credentials.getEmail(),
        credentials.getPassword()
    );

    if (user == null) {
      boolean emailExists = existingUser != null;
      String errorMessage = emailExists
          ? "Le mot de passe est incorrect."
          : "Cet email n'existe pas.";
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, errorMessage);
    }
    return user;
  }

  /**
   * Entry point to update the user profile.
   *
   * @param dto the payload sent by React.
   * @return the updated profile with a new token.
   */
  @PutMapping("/update")
  @PreAuthorize("isAuthenticated()")
  public AuthenticatedUser updateProfile(@RequestBody @Valid UpdateProfileDto dto) {
    AuthenticatedUser user = userService.updateProfile(
        dto.getEmail(),
        dto.getSpecialty(),
        dto.getProfileImage(),
        dto.getOldPassword(),
        dto.getNewPassword()
    );

    if (user == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Mauvais mot de passe ou utilisateur introuvable"
      );
    }
    return user;
  }

  /**
   * Returns the list of all users for the administration panel.
   *
   * @return the list of authenticated users.
   */
  @GetMapping("/users")
  @IsAdmin
  public List<AuthenticatedUser> getAllUsers() {
    return userService.getAllUsersForAdmin();
  }

  /**
   * Adds the administrator role to a user.
   *
   * @param email the email address of the user to promote.
   */
  @PutMapping("/addAdmin")
  @IsAdmin
  public void addAdmin(@RequestBody String email) {
    userService.addAdmin(email);
  }

  /**
   * Removes the administrator role from a user.
   *
   * @param email the email address of the user to demote.
   */
  @PutMapping("/removeAdmin")
  @IsAdmin
  public void removeAdmin(@RequestBody String email) {
    userService.removeAdmin(email);
  }

  /**
   * Bans a user from the platform.
   *
   * @param payload a map containing the email of the user to ban.
   */
  @PostMapping("/ban")
  @IsAdmin
  public void banUser(@RequestBody Map<String, String> payload) {
    String email = payload.get("email");
    if (email == null || email.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email requis pour bannir.");
    }
    String reason = payload.get("reason");
    userService.banUser(email, reason);
  }

  /**
   * Retrieves all users for the public directory.
   *
   * @return the list of players.
   */
  @GetMapping("/players")
  public List<AuthenticatedUser> getAllPlayers() {
    return userService.getAllUsersForAdmin();
  }
}