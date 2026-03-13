package be.vinci.ipl.cae.demo.models.dtos.equipe;

import be.vinci.ipl.cae.demo.models.dtos.membre.MembrePublicDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** DTO for public team information. */
public record EquipePublicDto(
        Long id,
        String name,
        List<MembrePublicDto> membres,
        @JsonProperty("isResponsable") boolean isResponsable) {
}
