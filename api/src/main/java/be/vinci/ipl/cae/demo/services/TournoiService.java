package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/** Service managing all business logic related to tournaments. */
@Service
public class TournoiService {

  private final TournoiRepository tournoiRepository;
  private final InscriptionEquipeTournoiService inscriptionService;

  public TournoiService(
      TournoiRepository tournoiRepository,
      @Lazy InscriptionEquipeTournoiService inscriptionService) {
    this.tournoiRepository = tournoiRepository;
    this.inscriptionService = inscriptionService;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REQUÊTES DE LECTURE
  // ═══════════════════════════════════════════════════════════════════

  public Iterable<Tournoi> getAllPublic() {
    return StreamSupport.stream(tournoiRepository.findAll().spliterator(), false)
        .filter(t -> !"BROUILLON".equals(t.getEtat()))
        .toList();
  }

  public Iterable<Tournoi> getAll() {
    return tournoiRepository.findAll();
  }

  public Optional<Tournoi> getOne(Long id) {
    return tournoiRepository.findById(id);
  }

  public Iterable<Tournoi> getFiltered(String etat, String nom) {
    boolean hasEtat = etat != null && !etat.isBlank();
    boolean hasNom = nom != null && !nom.isBlank();

    List<Tournoi> results;

    if (hasEtat && hasNom) {
      results = tournoiRepository.findByEtatAndNomContainingIgnoreCase(etat, nom);
    } else if (hasEtat) {
      results = tournoiRepository.findByEtat(etat);
    } else if (hasNom) {
      results = tournoiRepository.findByNomContainingIgnoreCase(nom);
    } else {
      results = StreamSupport.stream(tournoiRepository.findAll().spliterator(), false).toList();
    }

    return results.stream().filter(t -> !"BROUILLON".equals(t.getEtat())).toList();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CRÉATION ET MODIFICATION (BROUILLON)
  // ═══════════════════════════════════════════════════════════════════

  public Tournoi create(Tournoi tournoi) {
    if (tournoiRepository.findByNom(tournoi.getNom()).isPresent()) {
      return null;
    }
    tournoi.setEtat("BROUILLON");
    return tournoiRepository.save(tournoi);
  }

  public Tournoi update(Long id, Tournoi payload) {
    Tournoi existing = tournoiRepository.findById(id).orElse(null);
    if (existing == null || !"BROUILLON".equals(existing.getEtat())) {
      return null;
    }
    if (payload.getNom() != null) existing.setNom(payload.getNom());
    if (payload.getDescription() != null) existing.setDescription(payload.getDescription());
    if (payload.getDateDebut() != null) existing.setDateDebut(payload.getDateDebut());
    if (payload.getDateFin() != null) existing.setDateFin(payload.getDateFin());
    if (payload.getDateLimiteInscription() != null) existing.setDateLimiteInscription(payload.getDateLimiteInscription());
    if (payload.getNombresParticipantsMax() != null) existing.setNombresParticipantsMax(payload.getNombresParticipantsMax());
    
    return tournoiRepository.save(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // CYCLE DE VIE DU TOURNOI
  // ═══════════════════════════════════════════════════════════════════

  public Tournoi publish(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || !"BROUILLON".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("OUVERT");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Clôture manuelle par un Admin (OUVERT → CLOTURE).
   * Nécessite un minimum de 2 équipes inscrites.
   */
  public Tournoi closeRegistrations(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || !"OUVERT".equals(tournoi.getEtat())) {
      return null;
    }

    // On compte le nombre d'inscrits
    Iterable<InscriptionEquipeTournoi> inscrits = inscriptionService.getAllByTournoi(id);
    long count = 0;
    if (inscrits != null) {
      for (InscriptionEquipeTournoi i : inscrits) { count++; }
    }

    // Règle métier : 2 équipes minimum pour clôturer manuellement
    if (count < 2) {
      return null; 
    }

    tournoi.setEtat("CLOTURE");
    return tournoiRepository.save(tournoi);
  }

  /**
   * Démarre le tournoi (CLOTURE → EN_COURS).
   */
  public Tournoi start(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || !"CLOTURE".equals(tournoi.getEtat())) {
      return null;
    }
    // Plus besoin de gérer les "EN_ATTENTE", on passe juste en cours !
    tournoi.setEtat("EN_COURS");
    return tournoiRepository.save(tournoi);
  }

  public Tournoi finish(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || !"EN_COURS".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("TERMINE");
    return tournoiRepository.save(tournoi);
  }

  public Tournoi cancel(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || "TERMINE".equals(tournoi.getEtat()) || "ANNULE".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("ANNULE");
    return tournoiRepository.save(tournoi);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TÂCHES AUTOMATIQUES (CRON)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * S'exécute automatiquement tous les jours à minuit.
   * Vérifie les dates limites d'inscription des tournois ouverts.
   */
  @Scheduled(cron = "0 0 0 * * *")
  public void verifierEtCloturerTournoisExpires() {
    System.out.println("🤖 Vérification automatique des dates de tournois...");
    LocalDate aujourdHui = LocalDate.now();

    Iterable<Tournoi> tousLesTournois = tournoiRepository.findAll();

    for (Tournoi tournoi : tousLesTournois) {
      if ("OUVERT".equals(tournoi.getEtat()) && tournoi.getDateLimiteInscription() != null) {
        
        // Si la date limite est strictement dépassée
        if (tournoi.getDateLimiteInscription().isBefore(aujourdHui)) {
          
          Iterable<InscriptionEquipeTournoi> inscrits = inscriptionService.getAllByTournoi(tournoi.getId());
          long nbEquipes = 0;
          if (inscrits != null) {
            for (InscriptionEquipeTournoi i : inscrits) { nbEquipes++; }
          }

          if (nbEquipes >= 2) {
            System.out.println("✅ Tournoi " + tournoi.getNom() + " clôturé automatiquement (Date dépassée).");
            tournoi.setEtat("CLOTURE");
          } else {
            System.out.println("❌ Tournoi " + tournoi.getNom() + " annulé automatiquement (Moins de 2 joueurs).");
            tournoi.setEtat("ANNULE");
          }
          
          tournoiRepository.save(tournoi);
        }
      }
    }
  }
}