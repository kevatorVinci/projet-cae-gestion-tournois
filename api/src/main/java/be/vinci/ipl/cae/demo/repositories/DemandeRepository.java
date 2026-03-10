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

  // 🔍 Trouver toutes les demandes reçues par une équipe spécifique
  Iterable<Demande> findByEquipeId(Long equipeId);

  // 🔍 Trouver toutes les candidatures envoyées par un joueur spécifique
  Iterable<Demande> findByMembreId(Long membreId);

  // 🔍 Trouver les demandes d'une équipe selon leur statut
  // (ex: Que les "EN_ATTENTE")
  Iterable<Demande> findByEquipeIdAndEtat(Long equipeId, EtatDemande etat);

}