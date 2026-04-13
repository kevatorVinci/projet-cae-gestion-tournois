package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.RegistrationTeamTournament;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.StreamSupport;

/**
 * Service managing all business logic related to tournaments.
 */
@Service
public class TournamentService {

  private final TournamentRepository tournamentRepository;
  private final RegisterTeamTournamentService registrationService;
  private final NotificationService notificationService;
  private final UserRepository userRepository;

  /**
   * Creates the service with repositories and registration service.
   *
   * @param tournamentRepository the repo for tournaments.
   * @param registrationService  the service for team registrations.
   * @param notificationService  the service for user notifications.
   * @param userRepository       the repo for users.
   */
  public TournamentService(
      TournamentRepository tournamentRepository,
      @Lazy RegisterTeamTournamentService registrationService,
      NotificationService notificationService,
      UserRepository userRepository) {
    this.tournamentRepository = tournamentRepository;
    this.registrationService = registrationService;
    this.notificationService = notificationService;
    this.userRepository = userRepository;
  }

  // ═══════════════════════════════════════════════════════════════════
  // READ QUERIES
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Returns all public tournaments excluding BROUILLON.
   *
   * @return a list of non-draft tournaments.
   */
  public Iterable<Tournament> getAllPublic() {
    return StreamSupport.stream(tournamentRepository.findAll().spliterator(), false)
        // We filter out tournaments with the DRAFT ("BROUILLON") status
        .filter(t -> !"BROUILLON".equals(t.getStatus()))
        .toList();
  }

  /**
   * Returns all tournaments including BROUILLON.
   *
   * @return all tournaments.
   */
  public Iterable<Tournament> getAll() {
    return tournamentRepository.findAll();
  }

  /**
   * Returns one tournament by id if present.
   *
   * @param id the tournament id.
   * @return an optional containing the tournament if found.
   */
  public Optional<Tournament> getOne(Long id) {
    return tournamentRepository.findById(id);
  }

  /**
   * Returns public tournaments filtered by optional state and/or name.
   *
   * @param status the status to filter by.
   * @param name   the name to filter by.
   * @return filtered list of tournaments.
   */
  public Iterable<Tournament> getFiltered(String status, String name) {
    boolean hasStatus = status != null && !status.isBlank();
    boolean hasName = name != null && !name.isBlank();

    List<Tournament> results;

    if (hasStatus && hasName) {
      results = tournamentRepository.findByStatusAndNameContainingIgnoreCase(status, name);
    } else if (hasStatus) {
      results = tournamentRepository.findByStatus(status);
    } else if (hasName) {
      results = tournamentRepository.findByNameContainingIgnoreCase(name);
    } else {
      results = StreamSupport.stream(
          tournamentRepository.findAll().spliterator(), false).toList();
    }

    return results.stream().filter(t -> !"BROUILLON".equals(t.getStatus())).toList();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CREATE AND UPDATE (BROUILLON)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Creates a tournament in BROUILLON state if the name is unique.
   *
   * @param tournament the tournament to create.
   * @return the saved tournament or null if name exists.
   */
  public Tournament create(Tournament tournament) {
    if (tournamentRepository.findByName(tournament.getName()).isPresent()) {
      return null;
    }
    // Set initial status to draft
    tournament.setStatus("BROUILLON");
    Tournament saved = tournamentRepository.save(tournament);

    // Notify admins only
    Iterable<User> admins = userRepository.findAll();
    for (User user : admins) {
      if (user.isAdmin()) {
        notificationService.notifyDraftTournamentCreation(user, saved.getName());
      }
    }

    return saved;
  }

  /**
   * Updates a tournament only when it is still in BROUILLON state.
   *
   * @param id      the tournament id.
   * @param payload the new data.
   * @return the updated tournament or null.
   */
  public Tournament update(Long id, Tournament payload) {
    Tournament existing = tournamentRepository.findById(id).orElse(null);
    if (existing == null || !"BROUILLON".equals(existing.getStatus())) {
      return null;
    }

    // Update fields if they are provided in the payload
    if (payload.getName() != null) {
      existing.setName(payload.getName());
    }
    if (payload.getDescription() != null) {
      existing.setDescription(payload.getDescription());
    }
    if (payload.getStartDate() != null) {
      existing.setStartDate(payload.getStartDate());
    }
    if (payload.getEndDate() != null) {
      existing.setEndDate(payload.getEndDate());
    }
    if (payload.getRegistrationDeadline() != null) {
      existing.setRegistrationDeadline(payload.getRegistrationDeadline());
    }
    if (payload.getMaxParticipants() != null) {
      existing.setMaxParticipants(payload.getMaxParticipants());
    }

    return tournamentRepository.save(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TOURNAMENT LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Publishes a tournament (BROUILLON -> OUVERT).
   *
   * @param id the tournament id.
   * @return the published tournament.
   */
  public Tournament publish(Long id) {
    Tournament tournament = tournamentRepository.findById(id).orElse(null);
    if (tournament == null || !"BROUILLON".equals(tournament.getStatus())) {
      return null;
    }
    tournament.setStatus("OUVERT");
    Tournament saved = tournamentRepository.save(tournament);

    // Notify all users about publication
    Iterable<User> users = userRepository.findAll();
    for (User user : users) {
      notificationService.notifyTournamentPublished(user, saved.getName());
    }

    return saved;
  }

  /**
   * Manual closure by an admin (OUVERT -> CLOTURE).
   * Requires at least 2 registered teams.
   *
   * @param id the tournament id.
   * @return the closed tournament.
   */
  public Tournament closeRegistrations(Long id) {
    Tournament tournament = tournamentRepository.findById(id).orElse(null);
    if (tournament == null || !"OUVERT".equals(tournament.getStatus())) {
      return null;
    }

    // Count registered teams
    Iterable<RegistrationTeamTournament> registered = registrationService.getAllByTournament(id);
    long count = countRegistrations(registered);

    // Business rule: at least 2 teams are required for manual closure
    if (count < 2) {
      return null;
    }

    tournament.setStatus("CLOTURE");
    return tournamentRepository.save(tournament);
  }

  /**
   * Starts the tournament (CLOTURE -> EN_COURS).
   *
   * @param id the tournament id.
   * @return the started tournament.
   */
  public Tournament start(Long id) {
    Tournament tournament = tournamentRepository.findById(id).orElse(null);
    if (tournament == null || !"CLOTURE".equals(tournament.getStatus())) {
      return null;
    }
    // No need to manage "EN_ATTENTE" anymore, move directly to EN_COURS.
    tournament.setStatus("EN_COURS");
    return tournamentRepository.save(tournament);
  }

  /**
   * Marks a tournament as finished (EN_COURS -> TERMINE).
   *
   * @param id the tournament id.
   * @return the finished tournament.
   */
  public Tournament finish(Long id) {
    Tournament tournament = tournamentRepository.findById(id).orElse(null);
    if (tournament == null || !"EN_COURS".equals(tournament.getStatus())) {
      return null;
    }
    tournament.setStatus("TERMINE");
    return tournamentRepository.save(tournament);
  }

  /**
   * Cancels a tournament and optionally appends a reason to its display name.
   *
   * @param id     the tournament id.
   * @param reason the reason for cancellation.
   * @return the cancelled tournament.
   */
  public Tournament cancel(Long id, String reason) {
    Tournament tournament = tournamentRepository.findById(id).orElse(null);
    if (tournament == null
        || "TERMINE".equals(tournament.getStatus())
        || "ANNULE".equals(tournament.getStatus())) {
      return null;
    }

    tournament.setStatus("ANNULE");

    String sanitizedReason = (reason == null || reason.isBlank())
        ? "unspecified reason"
        : reason.trim();
    tournament.setName(tournament.getName() + " (Cancelled: " + sanitizedReason + ")");

    return tournamentRepository.save(tournament);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AUTOMATED TASKS (CRON)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Runs automatically every day at midnight.
   * Checks registration deadlines for open tournaments.
   */
  @Scheduled(cron = "0 0 0 * * *")
  public void checkAndCloseExpiredTournaments() {
    System.out.println(" Automatic check of tournament dates...");
    LocalDate today = LocalDate.now();

    Iterable<Tournament> allTournaments = tournamentRepository.findAll();

    for (Tournament tournament : allTournaments) {
      if ("OUVERT".equals(tournament.getStatus())
          && tournament.getRegistrationDeadline() != null) {

        // If the registration deadline is strictly in the past
        if (tournament.getRegistrationDeadline().isBefore(today)) {

          Iterable<RegistrationTeamTournament> registered =
              registrationService.getAllByTournament(tournament.getId());
          long teamCount = countRegistrations(registered);

          if (teamCount >= 2) {
            System.out.println(
                "✅ Tournament " + tournament.getName()
                    + " automatically closed (Date passed).");
            tournament.setStatus("CLOTURE");
          } else {
            System.out.println(
                "❌ Tournament " + tournament.getName()
                    + " automatically cancelled (Less than 2 registered teams).");
            tournament.setStatus("ANNULE");

            tournament.setName(
                tournament.getName() + " (Cancelled: less than 2 registered teams)");
          }

          tournamentRepository.save(tournament);
        }
      }
    }
  }

  /**
   * Helper method to count non-null registrations.
   *
   * @param registrations the iterable of registrations.
   * @return the count.
   */
  private long countRegistrations(Iterable<RegistrationTeamTournament> registrations) {
    if (registrations == null) {
      return 0;
    }
    return StreamSupport.stream(registrations.spliterator(), false)
        .filter(Objects::nonNull)
        .count();
  }
}