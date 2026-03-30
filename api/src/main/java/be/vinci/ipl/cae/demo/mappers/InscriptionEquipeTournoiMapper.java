package be.vinci.ipl.cae.demo.mappers;

import be.vinci.ipl.cae.demo.models.dtos.tournoi.EquipeTournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.dtos.tournoi.TournoiEquipeInscriptionDto;
import be.vinci.ipl.cae.demo.models.dtos.tournoi.TournoiResumeDto;
import be.vinci.ipl.cae.demo.models.entities.InscriptionEquipeTournoi;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InscriptionEquipeTournoiMapper {

  public TournoiEquipeInscriptionDto toTournoiEquipeInscriptionDto(
      InscriptionEquipeTournoi inscription) {
    if (inscription == null) {
      return null;
    }

    return new TournoiEquipeInscriptionDto(
        inscription.getEquipe().getId(),
        inscription.getEquipe().getName(),
        inscription.getDateInscription());
  }

  public List<TournoiEquipeInscriptionDto> toTournoiEquipeInscriptionDtos(
      Iterable<InscriptionEquipeTournoi> inscriptions) {
    List<TournoiEquipeInscriptionDto> result = new ArrayList<>();
    for (InscriptionEquipeTournoi inscription : inscriptions) {
      result.add(toTournoiEquipeInscriptionDto(inscription));
    }
    return result;
  }

  public EquipeTournamentRegistrationDto toEquipeTournamentRegistrationDto(
      InscriptionEquipeTournoi inscription) {
    if (inscription == null) {
      return null;
    }

    TournoiResumeDto tournoi = new TournoiResumeDto(
        inscription.getTournoi().getId(),
        inscription.getTournoi().getNom(),
        inscription.getTournoi().getEtat(),
        inscription.getTournoi().getDateDebut(),
        inscription.getTournoi().getNombresParticipantsMax());

    return new EquipeTournamentRegistrationDto(
        inscription.getTournoi().getId(),
        inscription.getEquipe().getId(),
        inscription.getDateInscription(),
        tournoi);
  }

  public List<EquipeTournamentRegistrationDto> toEquipeTournamentRegistrationDtos(
      Iterable<InscriptionEquipeTournoi> inscriptions) {
    List<EquipeTournamentRegistrationDto> result = new ArrayList<>();
    for (InscriptionEquipeTournoi inscription : inscriptions) {
      result.add(toEquipeTournamentRegistrationDto(inscription));
    }
    return result;
  }
}
