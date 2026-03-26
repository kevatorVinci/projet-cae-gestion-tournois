package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.dtos.UpdateProfileDto;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.validation.Valid;
import java.util.List;
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

  /**
   * Register a new user.
   *
   * @param credentials register payload
   * @return authenticated user with token
   */
  @PostMapping("/register")
  public AuthenticatedUser register(@RequestBody @Valid Credentials credentials) { 
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
  public AuthenticatedUser login(@RequestBody @Valid Credentials credentials) {
    AuthenticatedUser user = userService.login(credentials.getEmail(), credentials.getPassword());
    if (user == null) {
      boolean emailExists = userService.readOneFromEmail(credentials.getEmail()) != null;
      String errorMessage = emailExists 
          ? "Le mot de passe est incorrect." 
          : "Cet email n'existe pas.";
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, errorMessage);
    }
    return user;
  }

  /**
   * Porte d'entrée pour modifier le profil.
   *
   * @param dto le colis envoyé par React
   * @return le profil mis à jour avec un nouveau token
   */
  @PutMapping("/update")
  @PreAuthorize("isAuthenticated()")
  public AuthenticatedUser updateProfile(@RequestBody @Valid UpdateProfileDto dto) {
    AuthenticatedUser user =
        userService.updateProfile(
            dto.getEmail(),
            dto.getSpecialty(),
            dto.getProfileImage(),
            dto.getOldPassword(),
            dto.getNewPassword());

    if (user == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Mauvais mot de passe ou utilisateur introuvable");
    }
    return user;
  }

  /**
   * Retourne la liste de tous les utilisateurs pour l'administration.
   *
   * @return la liste des utilisateurs authentifiés
   */
  @GetMapping("/users")
  @IsAdmin
  public List<AuthenticatedUser> getAllUsers() {
    return userService.getAllUsersForAdmin();
  }

  /**
   * Ajoute le rôle administrateur à un utilisateur.
   *
   * @param email l'adresse email de l'utilisateur à promouvoir
   */
  @PutMapping("/addAdmin")
  @IsAdmin
  public void addAdmin(@RequestBody String email) {
    userService.addAdmin(email);
  }

  /**
   * Retire le rôle administrateur à un utilisateur.
   *
   * @param email l'adresse email de l'utilisateur à rétrograder
   */
  @PutMapping("/removeAdmin")
  @IsAdmin
  public void removeAdmin(@RequestBody String email) {
    userService.removeAdmin(email);
  }
}