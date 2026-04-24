package be.vinci.ipl.cae.demo.models.dtos.tournament;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/** Abstract Data Transfer Object for tournament information. */
public record TournamentAbstractDto(
    Long id,
    @JsonProperty("nom") String name,
    @JsonProperty("etat") String status,
    @JsonProperty("dateDebut") LocalDate startDate,
    @JsonProperty("nombresParticipantsMax") Integer maxParticipants) {}
