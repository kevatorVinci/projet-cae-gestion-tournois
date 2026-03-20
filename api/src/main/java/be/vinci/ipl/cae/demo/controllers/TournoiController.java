package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.annotations.IsAdmin;
import be.vinci.ipl.cae.demo.models.entities.Tournoi;
import be.vinci.ipl.cae.demo.services.TournoiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller managing tournament endpoints.
 */
@RestController
@RequestMapping("/tournois")
public class TournoiController {

    private final TournoiService tournoiService;

    /**
     * Constructs a TournoiController with the given service.
     *
     * @param tournoiService the tournament service
     */
    public TournoiController(TournoiService tournoiService) {
        this.tournoiService = tournoiService;
    }

    /**
     * Returns all public tournaments (not BROUILLON).
     * Accessible by everyone including visitors (US 2 & 3).
     */
    @GetMapping("/")
    public Iterable<Tournoi> getAllPublic() {
        return tournoiService.getAllPublic();
    }

    /**
     * Returns all tournaments including BROUILLON.
     * Reserved for admins.
     */
    @GetMapping("/all")
    @IsAdmin
    public Iterable<Tournoi> getAll() {
        return tournoiService.getAll();
    }

    /**
     * Returns a single tournament by id.
     * Accessible by everyone.
     */
    @GetMapping("/{id}")
    public Tournoi getOne(@PathVariable Long id) {
        return tournoiService.getOne(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /**
     * Creates a new tournament in BROUILLON state.
     * Reserved for admins (US 7).
     */
    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    @IsAdmin
    public Tournoi create(@Valid @RequestBody Tournoi tournoi) {
        Tournoi created = tournoiService.create(tournoi);
        if (created == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A tournament with this name already exists");
        }
        return created;
    }

    /**
     * Updates a tournament. Only allowed in BROUILLON state.
     * Reserved for admins (Could US 15).
     */
    @PutMapping("/{id}")
    @IsAdmin
    public Tournoi update(@PathVariable Long id, @RequestBody Tournoi payload) {
        Tournoi updated = tournoiService.update(id, payload);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or not in BROUILLON state");
        }
        return updated;
    }

    /**
     * Publishes a tournament (BROUILLON → OUVERT).
     * Reserved for admins (Should US 9).
     */
    @PatchMapping("/{id}/publish")
    @IsAdmin
    public Tournoi publish(@PathVariable Long id) {
        Tournoi tournoi = tournoiService.publish(id);
        if (tournoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or not in BROUILLON state");
        }
        return tournoi;
    }

    /**
     * Closes registrations for a tournament (OUVERT → CLOTURE).
     * Reserved for admins (Should US 10).
     */
    @PatchMapping("/{id}/close-registrations")
    @IsAdmin
    public Tournoi closeRegistrations(@PathVariable Long id) {
        Tournoi tournoi = tournoiService.closeRegistrations(id);
        if (tournoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or not in OUVERT state");
        }
        return tournoi;
    }

    /**
     * Starts a tournament (CLOTURE → EN_COURS).
     * All pending registrations are automatically refused.
     * Reserved for admins.
     */
    @PatchMapping("/{id}/start")
    @IsAdmin
    public Tournoi start(@PathVariable Long id) {
        Tournoi tournoi = tournoiService.start(id);
        if (tournoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or not in CLOTURE state");
        }
        return tournoi;
    }

    /**
     * Marks a tournament as finished (EN_COURS → TERMINE).
     * Reserved for admins.
     */
    @PatchMapping("/{id}/finish")
    @IsAdmin
    public Tournoi finish(@PathVariable Long id) {
        Tournoi tournoi = tournoiService.finish(id);
        if (tournoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or not in EN_COURS state");
        }
        return tournoi;
    }

    /**
     * Cancels a tournament from any active state.
     * Reserved for admins.
     */
    @PatchMapping("/{id}/cancel")
    @IsAdmin
    public Tournoi cancel(@PathVariable Long id) {
        Tournoi tournoi = tournoiService.cancel(id);
        if (tournoi == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tournament not found or already TERMINE/ANNULE");
        }
        return tournoi;
    }
}