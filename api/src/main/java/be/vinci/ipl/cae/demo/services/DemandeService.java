package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Demande;
import be.vinci.ipl.cae.demo.models.entities.Demande.EtatDemande;
import be.vinci.ipl.cae.demo.models.entities.Equipe;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.DemandeRepository;
import be.vinci.ipl.cae.demo.repositories.EquipeRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service gérant la logique métier des candidatures (demandes) pour rejoindre une équipe.
 * Centralise la création des requêtes, leur validation (acceptation ou refus), et l'application des
 * règles strictes (ex: vérification de l'absence d'équipe actuelle).
 */
@Service
public class DemandeService {

  private final DemandeRepository demandeRepo;
  private final UserRepository userRepo;
  private final EquipeRepository equipeRepo;

  /**
   * Constructeur injectant les dépendances nécessaires au service.
   *
   * @param demandeRepo Le repository gérant les demandes en base de données.
   * @param userRepo Le repository gérant les utilisateurs.
   * @param equipeRepo Le repository gérant les équipes.
   */
  public DemandeService(
      DemandeRepository demandeRepo, UserRepository userRepo, EquipeRepository equipeRepo) {
    this.demandeRepo = demandeRepo;
    this.userRepo = userRepo;
    this.equipeRepo = equipeRepo;
  }

  /**
   * Crée une nouvelle candidature pour un joueur souhaitant rejoindre une équipe. Vérifie
   * automatiquement si le joueur possède déjà une équipe avant d'enregistrer la demande.
   *
   * @param membreId L'identifiant unique du joueur (User) qui postule.
   * @param equipeId L'identifiant unique de l'équipe ciblée.
   * @return L'objet Demande fraîchement créé et sauvegardé avec le statut EN_ATTENTE.
   * @throws RuntimeException Si le joueur n'existe pas, si l'équipe n'existe pas, ou si le joueur
   *     est déjà membre d'une équipe.
   */
  public Demande creerDemande(Long membreId, Long equipeId) {
    User membre =
        userRepo.findById(membreId).orElseThrow(() -> new RuntimeException("Joueur introuvable"));
    Equipe equipe =
        equipeRepo.findById(equipeId).orElseThrow(() -> new RuntimeException("Équipe introuvable"));

    if (user.getEquipe() != null) {
      throw new RuntimeException("Vous avez déjà une équipe !");
    }
    boolean hasNoResponsible =
        equipe.getResponsablePrincipal() == null && equipe.getResponsableSecondaire() == null;
    if (hasNoResponsible) {
      throw new RuntimeException("L'equipe n'a aucun responsable.");
    }

    if (!isEquipeEligibleForJoin(equipe)) {
      throw new RuntimeException("Cette equipe n'est plus disponible pour les demandes.");
    }

    if (demandeRepo.existsByMembreIdAndEquipeIdAndEtat(
        membreId, equipeId, EtatDemande.EN_ATTENTE)) {
      throw new RuntimeException("Une demande en attente existe deja pour cette equipe.");
    }

    Demande demande = new Demande();
    demande.setMembre(user);
    demande.setEquipe(equipe);
    demande.setEtat(EtatDemande.EN_ATTENTE);

    return demandeRepo.save(demande);
  }

  /**
   * Récupère la liste de toutes les candidatures n'ayant pas encore été traitées pour une équipe
   * donnée. Idéal pour l'affichage sur le tableau de bord du responsable d'équipe.
   *
   * @param equipeId L'identifiant de l'équipe pour laquelle on cherche les candidatures.
   * @return Une collection itérable contenant uniquement les demandes au statut EN_ATTENTE.
   */
  public Iterable<Demande> getDemandesEnAttentePourEquipe(Long equipeId) {
    Equipe equipe = equipeRepo.findById(equipeId).orElse(null);
    if (equipe == null || !isEquipeEligibleForJoin(equipe)) {
      // Nettoyage defensif: evite des notifications orphelines pour une equipe invalide.
      demandeRepo.deleteByEquipeIdAndEtat(equipeId, EtatDemande.EN_ATTENTE);
      return List.of();
    }
    return demandeRepo.findByEquipeIdAndEtat(equipeId, EtatDemande.EN_ATTENTE);
  }

  /**
   * Accepte officiellement la candidature d'un joueur. Modifie le statut de la demande, enregistre
   * la date de traitement, et affecte immédiatement le joueur à sa nouvelle équipe dans la base de
   * données.
   *
   * @param demandeId L'identifiant de la demande à valider.
   * @return La demande mise à jour avec le statut ACCEPTEE.
   * @throws RuntimeException Si la demande spécifiée n'existe pas en base de données.
   */
  public Demande accepterDemande(Long demandeId, User currentUser) {
    Demande demande = getAndVerifyDemande(demandeId, currentUser);
    Equipe equipe = demande.getEquipe();

    if (!isEquipeEligibleForJoin(equipe)) {
      throw new RuntimeException("L'equipe cible n'est plus disponible.");
    }

    demande.setEtat(EtatDemande.ACCEPTEE);
    demande.setDateTraitement(LocalDateTime.now());

    User user = demande.getMembre();
    if (user.getEquipe() != null) {
      throw new RuntimeException("Le joueur appartient deja a une equipe.");
    }

    user.setEquipe(equipe);
    equipe.getMembres().add(user);
    userRepo.save(user);
    equipeRepo.save(equipe);

    // Toutes les autres demandes en attente de ce user deviennent obsoletes.
    demandeRepo.deleteByMembreIdAndEtat(user.getId(), EtatDemande.EN_ATTENTE);

    return demandeRepo.save(demande);
  }

  /**
   * Refuse la candidature d'un joueur en y attachant un motif de refus. Met à jour l'historique de
   * la demande sans affecter l'équipe actuelle du joueur. Note : L'envoi de notification est
   * actuellement désactivé.
   *
   * @param demandeId L'identifiant de la demande à rejeter.
   * @param raison Le texte expliquant le motif du refus (ex: "Niveau insuffisant").
   * @return La demande mise à jour avec le statut REFUSEE et son motif.
   * @throws RuntimeException Si la demande spécifiée n'existe pas en base de données.
   */
  public Demande refuserDemande(Long demandeId, String raison, User currentUser) {
    Demande demande = getAndVerifyDemande(demandeId, currentUser);

    demande.setEtat(EtatDemande.REFUSEE);
    demande.setRaisonRefus(raison);
    demande.setDateTraitement(LocalDateTime.now());

    return demandeRepo.save(demande);
  }

  /**
   * Récupère une demande et vérifie que l'utilisateur est responsable de l'équipe.
   *
   * @param demandeId L'identifiant de la demande.
   * @param currentUser L'utilisateur courant.
   * @return La demande trouvée.
   * @throws RuntimeException Si la demande n'existe pas.
   * @throws SecurityException Si l'utilisateur n'est pas responsable.
   */
  private Demande getAndVerifyDemande(Long demandeId, User currentUser) {
    Demande demande =
        demandeRepo
            .findById(demandeId)
            .orElseThrow(() -> new RuntimeException("Demande introuvable"));
    verifyUserIsResponsible(demande.getEquipe(), currentUser);
    return demande;
  }

  /**
   * Vérifie que l'utilisateur courant est responsable (principal ou secondaire) de l'équipe.
   *
   * @param equipe L'équipe à vérifier.
   * @param currentUser L'utilisateur courant.
   * @throws SecurityException Si l'utilisateur n'est pas responsable de l'équipe.
   */
  private void verifyUserIsResponsible(Equipe equipe, User currentUser) {
    // 1. On vérifie si c'est le principal (en s'assurant qu'il existe)
    boolean isPrincipal =
        equipe.getResponsablePrincipal() != null
            && equipe.getResponsablePrincipal().getId().equals(currentUser.getId());

    // 2. On vérifie si c'est le secondaire (en s'assurant qu'il n'est pas null !)
    boolean isSecondaire =
        equipe.getResponsableSecondaire() != null
            && equipe.getResponsableSecondaire().getId().equals(currentUser.getId());

    // 3. On applique la logique finale (Ni l'un, ET ni l'autre)
    if (!isPrincipal && !isSecondaire) {
      throw new SecurityException("Seul le responsable de l'équipe peut gérer les membres.");
    }
  }
}
