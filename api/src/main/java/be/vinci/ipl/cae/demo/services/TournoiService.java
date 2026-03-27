package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.repositories.TournoiRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
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

  /** Creates the service with repositories and registration service. */
  public TournoiService(
      TournoiRepository tournoiRepository,
      @Lazy InscriptionEquipeTournoiService inscriptionService) {
    this.tournoiRepository = tournoiRepository;
    this.inscriptionService = inscriptionService;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REQUÊTES DE LECTURE
  // ═══════════════════════════════════════════════════════════════════

  /** Returns all public tournaments excluding BROUILLON. */
  public Iterable<Tournoi> getAllPublic() {
    return StreamSupport.stream(tournoiRepository.findAll().spliterator(), false)
        .filter(t -> !"BROUILLON".equals(t.getEtat()))
        .toList();
  }

  /** Returns all tournaments including BROUILLON. */
  public Iterable<Tournoi> getAll() {
    return tournoiRepository.findAll();
  }

  /** Returns one tournament by id if present. */
  public Optional<Tournoi> getOne(Long id) {
    return tournoiRepository.findById(id);
  }

  /** Returns public tournaments filtered by optional state and/or name. */
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
      results = StreamSupport.stream(
          tournoiRepository.findAll().spliterator(), false).toList();
    }

    return results.stream().filter(t -> !"BROUILLON".equals(t.getEtat())).toList();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CRÉATION ET MODIFICATION (BROUILLON)
  // ═══════════════════════════════════════════════════════════════════

  /** Creates a tournament in BROUILLON state if the name is unique. */
  public Tournoi create(Tournoi tournoi) {
    if (tournoiRepository.findByNom(tournoi.getNom()).isPresent()) {
      return null;
    }
    tournoi.setEtat("BROUILLON");
    return tournoiRepository.save(tournoi);
  }

  /** Updates a tournament only when it is still in BROUILLON state. */
  public Tournoi update(Long id, Tournoi payload) {
    Tournoi existing = tournoiRepository.findById(id).orElse(null);
    if (existing == null || !"BROUILLON".equals(existing.getEtat())) {
      return null;
    }
    if (payload.getNom() != null) {
      existing.setNom(payload.getNom());
    }
    if (payload.getDescription() != null) {
      existing.setDescription(payload.getDescription());
    }
    if (payload.getDateDebut() != null) {
      existing.setDateDebut(payload.getDateDebut());
    }
    if (payload.getDateFin() != null) {
      existing.setDateFin(payload.getDateFin());
    }
    if (payload.getDateLimiteInscription() != null) {
      existing.setDateLimiteInscription(payload.getDateLimiteInscription());
    }
    if (payload.getNombresParticipantsMax() != null) {
      existing.setNombresParticipantsMax(payload.getNombresParticipantsMax());
    }

    return tournoiRepository.save(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // CYCLE DE VIE DU TOURNOI
  // ═══════════════════════════════════════════════════════════════════

  /** Publishes a tournament (BROUILLON -> OUVERT). */
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
    long count = countInscriptions(inscrits);

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

  /** Marks a tournament as finished (EN_COURS -> TERMINE). */
  public Tournoi finish(Long id) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null || !"EN_COURS".equals(tournoi.getEtat())) {
      return null;
    }
    tournoi.setEtat("TERMINE");
    return tournoiRepository.save(tournoi);
  }

  /** Cancels a tournament and optionally appends a reason to its display name. */
  public Tournoi cancel(Long id, String reason) {
    Tournoi tournoi = tournoiRepository.findById(id).orElse(null);
    if (tournoi == null
        || "TERMINE".equals(tournoi.getEtat())
        || "ANNULE".equals(tournoi.getEtat())) {
      return null;
    }

    tournoi.setEtat("ANNULE");

    String sanitizedReason = (reason == null || reason.isBlank())
        ? "raison non specifiee"
        : reason.trim();
    tournoi.setNom(tournoi.getNom() + " (Annulé : " + sanitizedReason + ")");

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
    System.out.println(" Vérification automatique des dates de tournois...");
    LocalDate aujourdHui = LocalDate.now();

    Iterable<Tournoi> tousLesTournois = tournoiRepository.findAll();

    for (Tournoi tournoi : tousLesTournois) {
      if ("OUVERT".equals(tournoi.getEtat()) && tournoi.getDateLimiteInscription() != null) {

        // Si la date limite est strictement dépassée
        if (tournoi.getDateLimiteInscription().isBefore(aujourdHui)) {

          Iterable<InscriptionEquipeTournoi> inscrits =
              inscriptionService.getAllByTournoi(tournoi.getId());
          long nbEquipes = countInscriptions(inscrits);

          if (nbEquipes >= 2) {
            System.out.println(
                "✅ Tournoi " + tournoi.getNom()
                    + " clôturé automatiquement (Date dépassée).");
            tournoi.setEtat("CLOTURE");
          } else {
            System.out.println(
                "❌ Tournoi " + tournoi.getNom()
                    + " annulé automatiquement (Moins de 2 joueurs).");
            tournoi.setEtat("ANNULE");

            tournoi.setNom(tournoi.getNom() + " (Annulé : moins de 2 equipes inscrites)");
          }

          tournoiRepository.save(tournoi);
        }
      }
    }
  }

  private long countInscriptions(Iterable<InscriptionEquipeTournoi> inscriptions) {
    if (inscriptions == null) {
      return 0;
    }
    return StreamSupport.stream(inscriptions.spliterator(), false)
        .filter(Objects::nonNull)
        .count();
  }
}