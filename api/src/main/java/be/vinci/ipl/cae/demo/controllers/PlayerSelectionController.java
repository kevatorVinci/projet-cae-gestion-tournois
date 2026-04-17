package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.mappers.PlayerSelectionMapper;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionDto;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.services.PlayerSelectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller for managing player selections in matches.
 */
@RestController
@RequestMapping("/selections")
public class PlayerSelectionController {

    private final PlayerSelectionService playerSelectionService;
    private final PlayerSelectionMapper playerSelectionMapper;

    /**
     * Constructor.
     *
     * @param playerSelectionService the service
     * @param playerSelectionMapper  the mapper
     */
    public PlayerSelectionController(
            PlayerSelectionService playerSelectionService,
            PlayerSelectionMapper playerSelectionMapper) {
        this.playerSelectionService = playerSelectionService;
        this.playerSelectionMapper = playerSelectionMapper;
    }

    /**
     * Adds a player to a match.
     *
     * @param createDto the selection data
     * @return the created selection
     */
    @PostMapping
    public ResponseEntity<PlayerSelectionDto> createOne(
            @RequestBody PlayerSelectionCreateDto createDto) {
        PlayerSelection savedSelection = playerSelectionService.createSelection(
                createDto.getMatchId(),
                createDto.getMemberId(),
                createDto.getTeamId()
        );
        if (savedSelection == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerSelectionMapper.toDto(savedSelection));
    }

    /**
     * Gets all players selected for a specific match.
     *
     * @param matchId the match id
     * @return list of selections
     */
    @GetMapping("/match/{matchId}")
    public ResponseEntity<Iterable<PlayerSelectionDto>> getAllForMatch(@PathVariable Long matchId) {
        Iterable<PlayerSelection> selections = playerSelectionService.getSelectionsForMatch(matchId);
        List<PlayerSelectionDto> dtos = new ArrayList<>();
        for (PlayerSelection selection : selections) {
            dtos.add(playerSelectionMapper.toDto(selection));
        }
        return ResponseEntity.ok(dtos);
    }
}