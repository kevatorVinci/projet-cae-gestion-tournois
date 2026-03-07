package be.vinci.ipl.cae.demo.models.dtos.equipedto;

import be.vinci.ipl.cae.demo.models.dtos.membredto.MembrePublicDto;
import java.util.List;

/**
 * DTO for public team information.
 */
public record EquipePublicDto(
    Long id,
    String name,
    List<MembrePublicDto> membres
) {

}
