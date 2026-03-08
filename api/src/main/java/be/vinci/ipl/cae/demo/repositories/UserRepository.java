package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository // On indique à Spring Boot que ce fichier est notre assistant pour la base de données
public interface UserRepository extends CrudRepository<User, Long> {

    /**
     * Cette méthode permet de chercher un membre dans la base de données grâce à son adresse email.
     * C'est super utile pour la connexion, ou pour vérifier des informations !
     *
     * @param email "C'est l'adresse email exacte que l'on veut rechercher dans notre armoire"
     * @return "Le membre trouvé avec toutes ses infos, ou rien du tout si l'email n'existe pas"
     */
    User findByEmail(String email);

    /**
     * Cette méthode vérifie simplement si un membre existe déjà avec cet email.
     * On l'utilise pendant l'inscription pour être sûr que l'email n'est pas déjà pris !
     *
     * @param email "L'adresse email que le nouveau membre essaie d'utiliser pour s'inscrire"
     * @return "Vrai (true) si l'email est déjà pris, et Faux (false) si l'email est libre"
     */
    boolean existsByEmail(String email);

}