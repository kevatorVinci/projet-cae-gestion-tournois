package be.vinci.ipl.cae.demo.models.dtos.tournament;

import be.vinci.ipl.cae.demo.models.dtos.team.TeamReferenceDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/** DTO for returning tournament data. */
public record TournamentResponseDto(
    Long id,
    @JsonProperty("nom") String name,
    String description,
    @JsonProperty("dateDebut") LocalDate startDate,
    @JsonProperty("dateFin") LocalDate endDate,
    @JsonProperty("dateLimiteInscription") LocalDate registrationDeadline,
    @JsonProperty("etat") String status,
    @JsonProperty("nombresParticipantsMax") Integer maxParticipants,
    @JsonProperty("planningMatchPublie") boolean matchSchedulePublished,
    @JsonProperty("gagnant") TeamReferenceDto winner) {}
