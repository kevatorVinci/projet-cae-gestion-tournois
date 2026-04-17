package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionDto;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import org.springframework.stereotype.Component;

/**
 * Mapper for PlayerSelection entity.
 */
@Component
public class PlayerSelectionMapper {

    /**
     * Converts an entity to a DTO.
     */
    public PlayerSelectionDto toDto(PlayerSelection selection) {
        PlayerSelectionDto dto = new PlayerSelectionDto();
        dto.setMatchId(selection.getMatch().getId());
        dto.setMemberId(selection.getMember().getId());
        dto.setTeamId(selection.getTeam().getId());
        return dto;
    }
}