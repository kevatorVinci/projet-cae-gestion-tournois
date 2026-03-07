package be.vinci.ipl.cae.demo.models.dtos.membredto;

/**
 * DTO for public member information.
 */
public record MembrePublicDto(
    Long id,
    String tagJeu,
    String specialite,
    String imageUrl,
    String equipeName
) {

}
