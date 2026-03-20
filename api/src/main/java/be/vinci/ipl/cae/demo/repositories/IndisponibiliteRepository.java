package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Indisponibilite;
import be.vinci.ipl.cae.demo.models.entities.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Dépôt pour gérer les indisponibilités dans la base de données.
 */
@Repository
public interface IndisponibiliteRepository extends CrudRepository<Indisponibilite, Long> {

    /**
     * Trouve toutes les indisponibilités d'un joueur précis.
     *
     * @param user le joueur concerné
     * @return la liste de ses indisponibilités
     */
    Iterable<Indisponibilite> findByUser(User user);
}