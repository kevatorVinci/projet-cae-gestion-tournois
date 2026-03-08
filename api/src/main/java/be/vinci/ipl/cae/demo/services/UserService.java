package be.vinci.ipl.cae.demo.services; // C'est le dossier où on range les cerveaux de l'application

import be.vinci.ipl.cae.demo.models.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;

@Service // On prévient Spring Boot que ce fichier contient de la logique métier (c'est un service)
public class UserService {

  // On appelle notre assistant de base de données (le Repository)
  private final UserRepository userRepository;

  /**
   * C'est le constructeur. Il permet à Spring Boot de nous donner l'assistant prêt à l'emploi.
   * @param userRepository "L'assistant qui va parler à la base de données"
   */
  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Cette méthode est l'action principale pour inscrire un nouveau membre.
   * * @param user "Le nouveau membre avec toutes les infos remplies dans le formulaire (email, tag, etc.)"
   * @return "Le membre sauvegardé dans la base de données, ou rien (null) si l'email était déjà pris"
   */
  public User register(User user) {

    // 1. On vérifie si l'adresse email existe déjà grâce à notre assistant
    if (userRepository.existsByEmail(user.getEmail())) {
      return null; // On arrête tout et on renvoie null car on ne peut pas avoir deux fois le même email !
    }

    // 2. Si l'email est libre, on demande à l'assistant de sauvegarder le membre dans l'armoire
    return userRepository.save(user);
  }

}