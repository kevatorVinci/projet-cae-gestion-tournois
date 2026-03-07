package be.vinci.ipl.cae.demo.models.dtos.equipedto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for creating a new team.
 */
public record EquipeCreationDto(
    @NotBlank String name
) {

}
