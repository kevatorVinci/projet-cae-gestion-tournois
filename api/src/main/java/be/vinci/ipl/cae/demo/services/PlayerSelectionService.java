package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionMemberDto;
import be.vinci.ipl.cae.demo.models.dtos.playerselection.PlayerSelectionTeamViewDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.PlayerSelection;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.PlayerSelectionRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling business logic for player selections.
 */
@Service
public class PlayerSelectionService {

  private static final int MAX_PLAYERS_PER_MATCH = 4;

  private final PlayerSelectionRepository playerSelectionRepository;
  private final MatchRepository matchRepository;
  private final UserRepository userRepository;
  private final TeamRepository teamRepository;

  /**
   * Builds the service.
   *
   * @param playerSelectionRepository selection repository.
   * @param matchRepository match repository.
   * @param userRepository user repository.
   * @param teamRepository team repository.
   */
  public PlayerSelectionService(
      PlayerSelectionRepository playerSelectionRepository,
      MatchRepository matchRepository,
      UserRepository userRepository,
      TeamRepository teamRepository) {
    this.playerSelectionRepository = playerSelectionRepository;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.teamRepository = teamRepository;
  }

  /**
   * Replaces one team's lineup for a given match.
   *
   * @param matchId target match id.
   * @param teamId target team id.
   * @param memberIds selected member ids.
   * @param currentUser current authenticated user.
   * @return saved selections after replacement.
   */
  @Transactional
  public List<PlayerSelection> updateTeamSelections(
      Long matchId,
      Long teamId,
      List<Long> memberIds,
      User currentUser) {
    Match match = matchRepository.findById(matchId)
        .orElseThrow(() -> new IllegalArgumentException("Match introuvable."));

    Team selectedTeam = resolveSelectedTeam(match, teamId);
    validateCanEditSelection(match, selectedTeam, currentUser);

    Set<Long> uniqueMemberIds = sanitizeMemberIds(memberIds);

    if (uniqueMemberIds.size() > MAX_PLAYERS_PER_MATCH) {
      throw new IllegalStateException("La sélection est limitée à 4 joueurs.");
    }

    Set<Long> teamMemberIds = selectedTeam.getMembers().stream()
        .map(User::getId)
        .collect(Collectors.toSet());

    for (Long memberId : uniqueMemberIds) {
      if (!teamMemberIds.contains(memberId)) {
        throw new IllegalStateException(
            "Un joueur sélectionné n'appartient pas à cette équipe."
        );
      }
    }

    playerSelectionRepository.deleteByMatchIdAndTeamId(matchId, teamId);

    List<PlayerSelection> savedSelections = new ArrayList<>();
    for (Long memberId : uniqueMemberIds) {
      User member = userRepository.findById(memberId)
          .orElseThrow(() -> new IllegalArgumentException("Membre introuvable."));

      PlayerSelection selection = new PlayerSelection();
      selection.setMatch(match);
      selection.setMember(member);
      selection.setTeam(selectedTeam);
      savedSelections.add(playerSelectionRepository.save(selection));
    }

    return savedSelections;
  }

  /**
   * Returns the visible selections for a match depending on user permissions.
   *
   * @param matchId match id.
   * @param currentUser current authenticated user.
   * @return visible selections list.
   */
  public List<PlayerSelection> getSelectionsForMatch(Long matchId, User currentUser) {
    Match match = matchRepository.findById(matchId)
        .orElseThrow(() -> new IllegalArgumentException("Match introuvable."));

    List<PlayerSelection> allSelections = toList(
        playerSelectionRepository.findByMatchId(matchId)
    );

    // Publicly visible as soon as the match starts.
    if (isMatchStarted(match) || isAdmin(currentUser)) {
      return allSelections;
    }

    if (belongsToTeam(match.getTeam1(), currentUser)) {
      return toList(
          playerSelectionRepository.findByMatchIdAndTeamId(
              matchId,
              match.getTeam1().getId()
          )
      );
    }

    if (belongsToTeam(match.getTeam2(), currentUser)) {
      return toList(
          playerSelectionRepository.findByMatchIdAndTeamId(
              matchId,
              match.getTeam2().getId()
          )
      );
    }

    return List.of();
  }

  /**
   * Returns one team's selections for a match after visibility checks.
   *
   * @param matchId match id.
   * @param teamId team id.
   * @param currentUser current authenticated user.
   * @return selected players for the requested team.
   */
  public List<PlayerSelection> getSelectionsForMatchTeam(
      Long matchId,
      Long teamId,
      User currentUser) {
    Match match = findMatchOrThrow(matchId);
    resolveAndValidateViewAccess(match, teamId, currentUser);

    return toList(playerSelectionRepository.findByMatchIdAndTeamId(matchId, teamId));
  }

  /**
   * Builds the editor view for one team's lineup in a match.
   *
   * @param matchId match id.
   * @param teamId team id.
   * @param currentUser current authenticated user.
   * @return editor view with members, selected state and permissions.
   */
  public PlayerSelectionTeamViewDto getTeamSelectionView(
      Long matchId,
      Long teamId,
      User currentUser) {
    Match match = findMatchOrThrow(matchId);
    Team selectedTeam = resolveAndValidateViewAccess(match, teamId, currentUser);

    List<PlayerSelection> selections = toList(
        playerSelectionRepository.findByMatchIdAndTeamId(matchId, teamId)
    );
    Set<Long> selectedIds = selections.stream()
        .map(selection -> selection.getMember().getId())
        .collect(Collectors.toSet());

    List<PlayerSelectionMemberDto> members = new ArrayList<>();
    for (User member : selectedTeam.getMembers()) {
      PlayerSelectionMemberDto memberDto = new PlayerSelectionMemberDto();
      memberDto.setMemberId(member.getId());
      memberDto.setTag(member.getTag());
      memberDto.setSpecialty(member.getSpecialty());
      memberDto.setProfileImageUrl(member.getProfileImageUrl());
      memberDto.setSelected(selectedIds.contains(member.getId()));
      members.add(memberDto);
    }

    PlayerSelectionTeamViewDto response = new PlayerSelectionTeamViewDto();
    response.setMatchId(matchId);
    response.setTeamId(teamId);
    response.setCanEdit(!isMatchStarted(match)
        && (isAdmin(currentUser) || isResponsible(selectedTeam, currentUser)));
    response.setMaxPlayers(MAX_PLAYERS_PER_MATCH);
    response.setSelectedCount(selectedIds.size());
    response.setMembers(members);
    return response;
  }

  private Match findMatchOrThrow(Long matchId) {
    return matchRepository.findById(matchId)
        .orElseThrow(() -> new IllegalArgumentException("Match introuvable."));
  }

  private Team resolveAndValidateViewAccess(
      Match match,
      Long teamId,
      User currentUser) {
    Team selectedTeam = resolveSelectedTeam(match, teamId);
    validateCanViewTeamSelection(match, selectedTeam, currentUser);
    return selectedTeam;
  }

  private Team resolveSelectedTeam(Match match, Long teamId) {
    if (match.getTeam1() != null && match.getTeam1().getId().equals(teamId)) {
      return match.getTeam1();
    }
    if (match.getTeam2() != null && match.getTeam2().getId().equals(teamId)) {
      return match.getTeam2();
    }
    throw new IllegalArgumentException("Cette équipe n'est pas concernée par ce match.");
  }

  private void validateCanEditSelection(Match match, Team selectedTeam, User currentUser) {
    if (isMatchStarted(match)) {
      throw new IllegalStateException(
          "La composition ne peut plus être modifiée après le début du match."
      );
    }

    if (isAdmin(currentUser)) {
      return;
    }

    if (!isResponsible(selectedTeam, currentUser)) {
      throw new SecurityException(
          "Seul le responsable de l'équipe peut modifier la composition."
      );
    }
  }

  private void validateCanViewTeamSelection(Match match, Team team, User currentUser) {
    // Visible to everyone once the match has started.
    if (isMatchStarted(match) || isAdmin(currentUser)) {
      return;
    }

    if (!belongsToTeam(team, currentUser)) {
      throw new SecurityException("La composition n'est pas visible pour cet utilisateur.");
    }
  }

  private Set<Long> sanitizeMemberIds(List<Long> memberIds) {
    List<Long> safeList = memberIds == null ? List.of() : memberIds;

    for (Long memberId : safeList) {
      if (memberId == null) {
        throw new IllegalArgumentException("Un identifiant de membre est invalide.");
      }
    }
    return new LinkedHashSet<>(safeList);
  }

  private boolean isAdmin(User user) {
    return user != null && user.isAdmin();
  }

  private boolean belongsToTeam(Team team, User user) {
    if (team == null || user == null || user.getId() == null) {
      return false;
    }

    boolean isMember = team.getMembers().stream()
        .anyMatch(member -> member.getId().equals(user.getId()));

    return isMember || isResponsible(team, user);
  }

  private boolean isResponsible(Team team, User user) {
    if (team == null || user == null || user.getId() == null) {
      return false;
    }

    boolean isPrimary = team.getPrimaryResponsible() != null
        && team.getPrimaryResponsible().getId().equals(user.getId());
    boolean isSecondary = team.getSecondaryResponsible() != null
        && team.getSecondaryResponsible().getId().equals(user.getId());
    return isPrimary || isSecondary;
  }

  private boolean isMatchStarted(Match match) {
    // A match without scheduled date is considered not started.
    return match.getScheduledDateTime() != null
        && !LocalDateTime.now().isBefore(match.getScheduledDateTime());
  }

  private List<PlayerSelection> toList(Iterable<PlayerSelection> selections) {
    List<PlayerSelection> result = new ArrayList<>();
    for (PlayerSelection selection : selections) {
      result.add(selection);
    }
    return result;
  }
}