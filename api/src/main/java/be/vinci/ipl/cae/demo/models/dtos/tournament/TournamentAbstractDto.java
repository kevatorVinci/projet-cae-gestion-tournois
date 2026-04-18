package be.vinci.ipl.cae.demo.models.dtos.tournament;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Abstract Data Transfer Object for tournament information.
 */
public record TournamentAbstractDto(
    Long id,
    @JsonProperty("nom") String name,
    @JsonProperty("etat") String status,
    @JsonProperty("dateDebut") LocalDate startDate,
    @JsonProperty("nombresParticipantsMax") Integer maxParticipants) {
}