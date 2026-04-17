package be.vinci.ipl.cae.demo.models.dtos.match;

import lombok.Data;

@Data
public class MatchResultCreateDto {
    private int scoreTeam1;
    private int scoreTeam2;
    private boolean isForfeitTeam1;
    private boolean isForfeitTeam2;
    private Long adminEncoderId;
    // La date sera générée automatiquement par le backend (LocalDateTime.now()) !
}