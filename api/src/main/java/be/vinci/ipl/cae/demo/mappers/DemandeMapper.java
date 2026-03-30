package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.demande.DemandeDto;
import be.vinci.ipl.cae.demo.models.entities.Demande;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DemandeMapper {

  public DemandeDto toDto(Demande demande) {
    if (demande == null) {
      return null;
    }

    return new DemandeDto(
        demande.getIdDemande(),
        demande.getMembre().getId(),
        demande.getMembre().getEmail(),
        demande.getMembre().getTag(),
        demande.getMembre().getSpecialty(),
        demande.getMembre().getProfileImageUrl(),
        demande.getEquipe().getId(),
        demande.getEquipe().getName(),
        demande.getEtat(),
        demande.getDateDemande(),
        demande.getDateTraitement(),
        demande.getRaisonRefus());
  }

  public List<DemandeDto> toDtos(Iterable<Demande> demandes) {
    List<DemandeDto> result = new ArrayList<>();
    for (Demande demande : demandes) {
      result.add(toDto(demande));
    }
    return result;
  }
}
