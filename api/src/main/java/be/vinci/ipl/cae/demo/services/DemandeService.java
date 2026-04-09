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
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling the business logic of team join requests.
 * Centralizes request creation, validation (accept/reject), and strict rule
 * enforcement
 * (for example, checking that the player is not already in a team).
 */
@Service
public class DemandeService {

  private final DemandeRepository demandeRepo;
  private final UserRepository userRepo;
  private final EquipeRepository equipeRepo;
  private final NotificationService notificationService;

  /**
   * Builds the service with required dependencies.
   *
   * @param demandeRepo request repository
   * @param userRepo    user repository
   * @param equipeRepo  team repository
   */
  public DemandeService(
      DemandeRepository demandeRepo,
      UserRepository userRepo,
      EquipeRepository equipeRepo,
      NotificationService notificationService) {
    this.demandeRepo = demandeRepo;
    this.userRepo = userRepo;
    this.equipeRepo = equipeRepo;
    this.notificationService = notificationService;
  }

  /**
   * Creates a new join request for a player who wants to join a team.
   * Automatically checks whether the player already belongs to a team before
   * saving the request.
   *
   * @param membreId unique ID of the player applying
   * @param equipeId unique ID of the target team
   * @return newly created and saved request with EN_ATTENTE status
   * @throws RuntimeException if the player does not exist, the team does not
   *                          exist, or the player
   *                          already belongs to a team
   */
  public Demande creerDemande(Long membreId, Long equipeId) {
    User membre = userRepo.findById(membreId).orElseThrow(() -> new RuntimeException("Joueur introuvable"));
    Equipe equipe = equipeRepo.findById(equipeId).orElseThrow(() -> new RuntimeException("Équipe introuvable"));

    if (membre.getEquipe() != null) {
      throw new RuntimeException("Vous avez déjà une équipe !");
    }
    boolean hasNoResponsible = equipe.getResponsablePrincipal() == null && equipe.getResponsableSecondaire() == null;
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
    demande.setMembre(membre);
    demande.setEquipe(equipe);
    demande.setEtat(EtatDemande.EN_ATTENTE);

    Demande savedDemande = demandeRepo.save(demande);
    notificationService.notifierDemandEnvoyee(membre, equipe.getName());
    if (equipe.getResponsablePrincipal() != null) {
      notificationService.notifierNouvelleDemandeResponsable(
          equipe.getResponsablePrincipal(), membre.getTag(), equipe.getName());
    }
    return savedDemande;
  }

  /**
   * Gets all pending requests for a given team.
   * Useful for the team responsible user's dashboard.
   *
   * @param equipeId team ID used to filter requests
   * @return iterable collection containing only EN_ATTENTE requests
   */
  @Transactional
  public Iterable<Demande> getDemandesEnAttentePourEquipe(Long equipeId) {
    Equipe equipe = equipeRepo.findById(equipeId).orElse(null);
    if (equipe != null && !isEquipeEligibleForJoin(equipe)) {
      // Defensive cleanup: avoid orphan notifications for an invalid team.
      demandeRepo.deleteByEquipeIdAndEtat(equipeId, EtatDemande.EN_ATTENTE);
      return List.of();
    }
    return demandeRepo.findByEquipeIdAndEtat(equipeId, EtatDemande.EN_ATTENTE);
  }

  /**
   * Returns pending demands for the current responsible user's team.
   *
   * @param currentUser authenticated user
   * @return pending demands for current user's team
   */
  @Transactional
  public Iterable<Demande> getDemandesEnAttentePourResponsable(User currentUser) {
    if (currentUser == null) {
      throw new SecurityException("Utilisateur non authentifie.");
    }

    Equipe equipe = currentUser.getEquipe();

    // Primary path: use membership relation when available and valid.
    if (equipe != null) {
      verifyUserIsResponsible(equipe, currentUser);
      return getDemandesEnAttentePourEquipe(equipe.getId());
    }

    // Fallback path: handles inconsistent data where user.equipe is null but
    // the user is still configured as primary/secondary responsible.
    equipe = equipeRepo
        .findByResponsablePrincipalIdOrResponsableSecondaireId(
            currentUser.getId(), currentUser.getId())
        .orElseThrow(() -> new SecurityException("Vous n'etes responsable d'aucune equipe."));

    return getDemandesEnAttentePourEquipe(equipe.getId());
  }

  /**
   * Officially accepts a player's request.
   * Updates request status, stores processing date, and immediately assigns the
   * player
   * to the new team in the database.
   *
   * @param demandeId ID of the request to validate
   * @return updated request with ACCEPTEE status
   * @throws RuntimeException if the specified request does not exist
   */
  @Transactional
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

    // Save the accepted request FIRST
    Demande savedDemande = demandeRepo.save(demande);

    // THEN remove other pending requests for this user
    demandeRepo.deleteByMembreIdAndEtat(user.getId(), EtatDemande.EN_ATTENTE);

    notificationService.notifierDemandeAcceptee(user, equipe.getName());
    return savedDemande;
  }

  /**
   * Rejects a player's request with a rejection reason.
   * Updates request history without affecting the player's current team.
   *
   * @param demandeId ID of the request to reject
   * @param raison    text explaining the rejection reason (for example:
   *                  "Insufficient level")
   * @return updated request with REFUSEE status and reason
   * @throws RuntimeException if the specified request does not exist
   */
  @Transactional
  public Demande refuserDemande(Long demandeId, String raison, User currentUser) {
    Demande demande = getAndVerifyDemande(demandeId, currentUser);
    String raisonNormalisee = (raison == null || raison.isBlank()) ? "Aucune raison precisee." : raison.trim();

    demande.setEtat(EtatDemande.REFUSEE);
    demande.setRaisonRefus(raisonNormalisee);
    demande.setDateTraitement(LocalDateTime.now());

    Demande savedDemande = demandeRepo.save(demande);
    notificationService.notifierDemandeRefusee(
        demande.getMembre(), demande.getEquipe().getName(), raisonNormalisee);
    return savedDemande;
  }

  /**
   * Retrieves a request and verifies that the user is responsible for the team.
   *
   * @param demandeId   request ID
   * @param currentUser current user
   * @return matching request
   * @throws RuntimeException  if the request does not exist
   * @throws SecurityException if the user is not responsible
   */
  private Demande getAndVerifyDemande(Long demandeId, User currentUser) {
    Demande demande = demandeRepo
        .findById(demandeId)
        .orElseThrow(() -> new RuntimeException("Demande introuvable"));
    verifyUserIsResponsible(demande.getEquipe(), currentUser);
    return demande;
  }

  /**
   * Verifies that the current user is a responsible member (primary or secondary)
   * of the team.
   *
   * @param equipe      team to validate
   * @param currentUser current user
   * @throws SecurityException if the user is not responsible for the team
   */
  private void verifyUserIsResponsible(Equipe equipe, User currentUser) {
    // 1. Check whether the user is the primary responsible (if present)
    boolean isPrincipal = equipe.getResponsablePrincipal() != null
        && equipe.getResponsablePrincipal().getId().equals(currentUser.getId());

    // 2. Check whether the user is the secondary responsible (if present)
    boolean isSecondaire = equipe.getResponsableSecondaire() != null
        && equipe.getResponsableSecondaire().getId().equals(currentUser.getId());

    // 3. Apply final decision logic (neither primary nor secondary)
    if (!isPrincipal && !isSecondaire) {
      throw new SecurityException("Seul le responsable de l'équipe peut gérer les membres.");
    }
  }

  private boolean isEquipeEligibleForJoin(Equipe equipe) {
    if (equipe == null) {
      return false;
    }
    return equipe.getResponsablePrincipal() != null || equipe.getResponsableSecondaire() != null;
  }
}
