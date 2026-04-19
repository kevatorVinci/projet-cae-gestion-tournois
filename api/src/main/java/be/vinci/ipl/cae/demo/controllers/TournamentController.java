package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.mappers.MatchMapper;
import be.vinci.ipl.cae.demo.mappers.TournamentMapper;
import be.vinci.ipl.cae.demo.models.dtos.match.MatchDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentCancelDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentResponseDto;
import be.vinci.ipl.cae.demo.models.dtos.tournament.TournamentUpdateDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.MatchService;
import be.vinci.ipl.cae.demo.services.TournamentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller managing tournament endpoints.
 */
@RestController
@RequestMapping("/tournois")
public class TournamentController {

  private final TournamentService tournoiService;
  private final TournamentMapper tournamentMapper;
  private final MatchService matchService;
  private final MatchMapper matchMapper;

  /**
   * Creates the controller with its service dependencies.
   *
   * @param tournoiService    the tournament service to inject.
   * @param tournamentMapper  the tournament mapper to inject.
   * @param matchService      the match service to inject.
   * @param matchMapper       the match mapper to inject.
   */
  public TournamentController(
      TournamentService tournoiService,
      TournamentMapper tournamentMapper,
      MatchService matchService,
      MatchMapper matchMapper) {
    this.tournoiService = tournoiService;
    this.tournamentMapper = tournamentMapper;
    this.matchService = matchService;
    this.matchMapper = matchMapper;
  }

  /**
   * Returns public tournaments filtered by optional state and/or name search.
   *
   * @param etat optional state filter.
   * @param nom  optional name fragment for search.
   * @return filtered list of public tournaments.
   */
  @GetMapping("/")
  public Iterable<TournamentResponseDto> getAllPublic(
      @RequestParam(required = false) String etat,
      @RequestParam(required = false) String nom) {
    return tournamentMapper.toDtos(tournoiService.getFiltered(etat, nom));
  }

  /**
   * Returns all tournaments including BROUILLON. Reserved for admins.
   *
   * @return all tournaments.
   */
  @GetMapping("/all")
  @IsAdmin
  public Iterable<TournamentResponseDto> getAll() {
    return tournamentMapper.toDtos(tournoiService.getAll());
  }

  /**
   * Returns a single tournament by id.
   *
   * @param id the tournament identifier.
   * @return the found tournament.
   */
  @GetMapping("/{id}")
  public TournamentResponseDto getOne(@PathVariable Long id) {
    return tournoiService
        .getOne(id)
        .map(tournamentMapper::toDto)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  /**
   * Creates a new tournament in BROUILLON state.
   *
   * @param tournoi the tournament data.
   * @return the created tournament.
   */
  @PostMapping("/")
  @ResponseStatus(HttpStatus.CREATED)
  @IsAdmin
  public TournamentResponseDto create(@Valid @RequestBody TournamentCreateDto tournoi) {
    var created = tournoiService.create(tournamentMapper.toEntity(tournoi));
    if (created == null) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "A tournament with this name already exists");
    }
    return tournamentMapper.toDto(created);
  }

  /**
   * Updates a tournament. Only allowed in BROUILLON state.
   *
   * @param id      the tournament identifier.
   * @param payload the new tournament data.
   * @return the updated tournament.
   */
  @PutMapping("/{id}")
  @IsAdmin
  public TournamentResponseDto update(
      @PathVariable Long id,
      @Valid @RequestBody TournamentUpdateDto payload) {
    var tournament = tournamentMapper.toEntity(payload);
    var updated = tournoiService.update(id, tournament);
    if (updated == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found or not in BROUILLON state");
    }
    return tournamentMapper.toDto(updated);
  }

  /**
   * Publishes a tournament (BROUILLON to OUVERT).
   *
   * @param id the tournament identifier.
   * @return the published tournament.
   */
  @PatchMapping("/{id}/publish")
  @IsAdmin
  public TournamentResponseDto publish(@PathVariable Long id) {
    var tournoi = tournoiService.publish(id);
    if (tournoi == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found or not in BROUILLON state");
    }
    return tournamentMapper.toDto(tournoi);
  }

  /**
   * Closes registrations for a tournament (OUVERT to CLOTURE).
   *
   * @param id the tournament identifier.
   * @return the closed tournament.
   */
  @PatchMapping("/{id}/close-registrations")
  @IsAdmin
  public TournamentResponseDto closeRegistrations(@PathVariable Long id) {
    var tournoi = tournoiService.closeRegistrations(id);
    if (tournoi == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Tournament not found, not OUVERT, or not enough teams (minimum 2)");
    }
    return tournamentMapper.toDto(tournoi);
  }

  /**
   * Starts a tournament (CLOTURE to EN_COURS).
   *
   * @param id the tournament identifier.
   * @return the started tournament.
   */
  @PatchMapping("/{id}/start")
  @IsAdmin
  public TournamentResponseDto start(@PathVariable Long id) {
    var tournoi = tournoiService.start(id);
    if (tournoi == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found or not in CLOTURE state");
    }
    return tournamentMapper.toDto(tournoi);
  }

  /**
   * Marks a tournament as finished (EN_COURS to TERMINE).
   *
   * @param id the tournament identifier.
   * @return the finished tournament.
   */
  @PatchMapping("/{id}/finish")
  @IsAdmin
  public TournamentResponseDto finish(@PathVariable Long id) {
    var tournoi = tournoiService.finish(id);
    if (tournoi == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found or not in EN_COURS state");
    }
    return tournamentMapper.toDto(tournoi);
  }

  /**
   * Cancels a tournament from any active state.
   *
   * @param id the tournament identifier.
   * @param payload the cancellation payload.
   * @return the cancelled tournament.
   */
  @PatchMapping("/{id}/cancel")
  @IsAdmin
  public TournamentResponseDto cancel(
      @PathVariable Long id,
      @RequestBody(required = false) TournamentCancelDto payload) {
    String reason = payload == null ? null : payload.reason();
    var tournoi = tournoiService.cancel(id, reason);
    if (tournoi == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Tournament not found or already TERMINE/ANNULE");
    }
    return tournamentMapper.toDto(tournoi);
  }

  /**
   * Generates the first-round match schedule for a tournament.
   *
   * @param id          the tournament identifier.
   * @param currentUser the authenticated admin user.
   * @return the list of created match DTOs.
   */
  @PostMapping("/{id}/schedule")
  @IsAdmin
  public List<MatchDto> generateSchedule(
      @PathVariable Long id,
      @AuthenticationPrincipal User currentUser) {
    try {
      return matchMapper.toDtos(matchService.generateSchedule(id, currentUser));
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
    }
  }

  /**
   * Publishes the match schedule so it becomes visible to all users.
   *
   * @param id the tournament identifier.
   */
  @PostMapping("/{id}/schedule/publish")
  @IsAdmin
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void publishSchedule(@PathVariable Long id) {
    try {
      matchService.publishTournamentSchedule(id);
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }
  }

  /**
   * Returns all matches for a tournament (admin view, even if not published).
   *
   * @param id the tournament identifier.
   * @return a list of match DTOs.
   */
  @GetMapping("/{id}/matches/admin")
  @IsAdmin
  public List<MatchDto> getTournamentMatchesAdmin(@PathVariable Long id) {
    return matchMapper.toDtos(matchService.getTournamentMatches(id));
  }

  /**
   * Returns public matches for a tournament (only when schedule is published).
   *
   * @param id the tournament identifier.
   * @return a list of match DTOs.
   */
  @GetMapping("/{id}/matches")
  public List<MatchDto> getTournamentMatches(@PathVariable Long id) {
    return matchMapper.toDtos(matchService.getTournamentPublicMatches(id));
  }
}
