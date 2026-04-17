package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.PlayerSelectionMapper;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionDto;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.services.PlayerSelectionService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for managing player selections in matches.
 */
@RestController
@RequestMapping("/selections")
public class PlayerSelectionController {

    private final PlayerSelectionService playerSelectionService;
    private final PlayerSelectionMapper playerSelectionMapper;

    public PlayerSelectionController(PlayerSelectionService playerSelectionService, PlayerSelectionMapper playerSelectionMapper) {
        this.playerSelectionService = playerSelectionService;
        this.playerSelectionMapper = playerSelectionMapper;
    }

    /**
     * Adds a player to a match.
     * Receives a JSON (PlayerSelectionCreateDto) from the frontend.
     */
    @PostMapping
    public ResponseEntity<PlayerSelectionDto> createOne(@RequestBody PlayerSelectionCreateDto createDto) {

        // We send the IDs to the service to do the heavy lifting
        PlayerSelection savedSelection = playerSelectionService.createSelection(
                createDto.getMatchId(),
                createDto.getMemberId(),
                createDto.getTeamId()
        );

        if (savedSelection == null) {
            // If the match, user, or team doesn't exist, return a 400 Bad Request
            return ResponseEntity.badRequest().build();
        }

        // Return the successfully created selection with a 201 Created status
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerSelectionMapper.toDto(savedSelection));
    }

    /**
     * Gets all players selected for a specific match.
     */
    @GetMapping("/match/{matchId}")
    public ResponseEntity<Iterable<PlayerSelectionDto>> getAllForMatch(@PathVariable Long matchId) {
        Iterable<PlayerSelection> selections = playerSelectionService.getSelectionsForMatch(matchId);

        // We convert the list of Entities into a list of DTOs for the frontend
        List<PlayerSelectionDto> dtos = new ArrayList<>();
        for (PlayerSelection selection : selections) {
            dtos.add(playerSelectionMapper.toDto(selection));
        }

        return ResponseEntity.ok(dtos);
    }
}