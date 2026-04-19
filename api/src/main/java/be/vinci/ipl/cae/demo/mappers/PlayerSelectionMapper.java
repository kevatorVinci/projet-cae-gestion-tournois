package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionDto;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Mapper for PlayerSelection entity.
 */
@Component
public class PlayerSelectionMapper {

  /**
   * Converts an entity to a DTO.
   *
   * @param selection The selection entity.
   * @return The mapped DTO.
   */
  public PlayerSelectionDto toDto(PlayerSelection selection) {
    PlayerSelectionDto dto = new PlayerSelectionDto();
    dto.setMatchId(selection.getMatch().getId());
    dto.setMemberId(selection.getMember().getId());
    dto.setMemberTag(selection.getMember().getTag());
    dto.setMemberSpecialty(selection.getMember().getSpecialty());
    dto.setMemberProfileImageUrl(selection.getMember().getProfileImageUrl());
    dto.setTeamId(selection.getTeam().getId());
    dto.setTeamName(selection.getTeam().getName());
    return dto;
  }

  /**
   * Converts multiple entities to DTOs.
   *
   * @param selections The selection entities.
   * @return The mapped DTO list.
   */
  public List<PlayerSelectionDto> toDtos(Iterable<PlayerSelection> selections) {
    List<PlayerSelectionDto> dtos = new ArrayList<>();
    if (selections == null) {
      return dtos;
    }
    for (PlayerSelection selection : selections) {
      dtos.add(toDto(selection));
    }
    return dtos;
  }
}