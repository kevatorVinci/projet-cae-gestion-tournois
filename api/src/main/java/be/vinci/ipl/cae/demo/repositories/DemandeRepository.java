package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Demande;
import be.vinci.ipl.cae.demo.models.entities.Demande.EtatDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Demande (join requests) entities. Provides database access for managing team join
 * requests.
 */
@Repository
public interface DemandeRepository extends JpaRepository<Demande, Long> {

  /**
   * Find all demands for a team.
   *
   * @param equipeId team id
   * @return demands for the team
   */
  Iterable<Demande> findByEquipeId(Long equipeId);

  //   🔍 Trouver toutes les candidatures envoyées par un joueur spécifique
  Iterable<Demande> findByMembreId(Long membreId);

  /**
   * Find team demands by state.
   *
   * @param equipeId team id
   * @param etat target state
   * @return matching demands
   */
  Iterable<Demande> findByEquipeIdAndEtat(Long equipeId, EtatDemande etat);

  boolean existsByMembreIdAndEquipeIdAndEtat(Long membreId, Long equipeId, EtatDemande etat);

  void deleteByEquipeIdAndEtat(Long equipeId, EtatDemande etat);

  void deleteByMembreIdAndEtat(Long membreId, EtatDemande etat);
}
