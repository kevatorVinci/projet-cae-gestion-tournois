import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BackButton from '../../BackButton';
import {
  fetchMatchSelections,
  fetchTeamSelectionEditor,
  fetchTournamentById,
  fetchTournamentMatches,
  fetchTournamentMatchesAdmin,
  MatchPlayerSelection,
  MatchTeamSelectionView,
  TeamMatch,
  updateMatchTeamSelection,
  declareForfeit,
} from '../../../services/tournaments';
import { getUserTeam, isCurrentUserResponsable } from '../../../services/teams';
import { useAdminView } from '../../../contexts/useAdminView';
import { getAuthenticatedUser } from '../../../utils/session';
import { getRoundLabelFromMax } from '../../../utils/bracketLabels';

const normalizeImageSrc = (image?: string) => {
  if (!image) return undefined;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return image.startsWith('/') ? image : `/${image}`;
};

const toMatchId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDateTime = (dateValue?: string): string => {
  if (!dateValue) return 'Date non définie';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatShortDate = (dateValue?: string): string => {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('fr-BE');
};

const TournamentMatchCompositionPage = () => {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const navigate = useNavigate();
  const { isAdminView } = useAdminView();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState('');
  const [match, setMatch] = useState<TeamMatch | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [responsibleTeamId, setResponsibleTeamId] = useState<number | null>(
    null,
  );
  const [selections, setSelections] = useState<MatchPlayerSelection[]>([]);
  const [editorViews, setEditorViews] = useState<
    Record<number, MatchTeamSelectionView>
  >({});
  const [selectedByTeam, setSelectedByTeam] = useState<
    Record<number, number[]>
  >({});
  const [userTeamId, setUserTeamId] = useState<number | null>(null);
  const [savingTeamId, setSavingTeamId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [maxRound, setMaxRound] = useState(1);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [selectionDialogTeamId, setSelectionDialogTeamId] = useState<
    number | null
  >(null);

  // Forfeit dialog state
  const [forfeitDialogOpen, setForfeitDialogOpen] = useState(false);
  const [forfeitingTeamId, setForfeitingTeamId] = useState<number | null>(null);
  const [forfeitingTeamName, setForfeitingTeamName] = useState<string>('');

  const parsedMatchId = toMatchId(matchId);
  const effectiveAdminFlag =
    isAdminView && getAuthenticatedUser()?.admin === true;

  const refreshSelections = useCallback(
    async (token?: string) => {
      if (!parsedMatchId) return;
      const data = await fetchMatchSelections(parsedMatchId, token);
      setSelections(data);
    },
    [parsedMatchId],
  );

  const loadEditor = useCallback(
    async (teamId: number, token: string) => {
      if (!parsedMatchId) return;
      const view = await fetchTeamSelectionEditor(parsedMatchId, teamId, token);
      setEditorViews((prev) => ({ ...prev, [teamId]: view }));
      setSelectedByTeam((prev) => ({
        ...prev,
        [teamId]: view.members
          .filter((member) => member.selected)
          .map((member) => member.memberId),
      }));
    },
    [parsedMatchId],
  );

  const openPlayerProfile = (memberId?: number) => {
    if (!memberId) return;
    navigate(`/players/${memberId}`);
  };

  const openTeamDetails = (teamId?: number) => {
    if (!teamId) return;
    navigate(`/equipes/${teamId}`);
  };

  useEffect(() => {
    const load = async () => {
      if (!id || !parsedMatchId) {
        setError('Identifiants du tournoi ou du match invalides.');
        setLoading(false);
        return;
      }

      try {
        const user = getAuthenticatedUser();
        const token = user?.token;
        const adminFlag = effectiveAdminFlag;
        setIsAdmin(adminFlag);

        const tournoi = await fetchTournamentById(id);
        setTournamentName(tournoi.nom || `Tournoi #${id}`);

        let matchList: TeamMatch[] = [];
        if (tournoi.planningMatchPublie === true) {
          matchList = await fetchTournamentMatches(id);
        } else {
          if (token) {
            const adminMatches = await fetchTournamentMatchesAdmin(id, token);
            if (adminMatches.length > 0) {
              matchList = adminMatches;
            }
          }
          if (matchList.length === 0) {
            matchList = await fetchTournamentMatches(id);
          }
        }

        const selectedMatchRaw =
          matchList.find((item) => toMatchId(item.id) === parsedMatchId) ??
          null;

        let selectedMatch = selectedMatchRaw;

        // Infer teams for advanced rounds if not yet populated in the database
        if (selectedMatch) {
          const currentRound = selectedMatch.round ?? 1;

          if (
            currentRound > 1 &&
            (selectedMatch.team1Id == null || selectedMatch.team2Id == null)
          ) {
            const sameRoundMatches = matchList
              .filter((m) => (m.round ?? 1) === currentRound)
              .sort((a, b) => String(a.id).localeCompare(String(b.id)));

            const matchIndex = sameRoundMatches.findIndex(
              (m) => m.id === selectedMatch?.id,
            );

            if (matchIndex !== -1) {
              const prevRoundMatches = matchList
                .filter((m) => (m.round ?? 1) === currentRound - 1)
                .sort((a, b) => {
                  if (a.scheduledDateTime && b.scheduledDateTime) {
                    const diff =
                      new Date(a.scheduledDateTime).getTime() -
                      new Date(b.scheduledDateTime).getTime();
                    if (diff !== 0) return diff;
                  }
                  return String(a.id).localeCompare(String(b.id));
                });

              const p1Match = prevRoundMatches[matchIndex * 2];
              const p2Match = prevRoundMatches[matchIndex * 2 + 1];

              // Utility function to extract the winner of the previous match
              const getWinner = (m?: TeamMatch) => {
                if (!m) return { id: undefined, name: undefined };

                const statusVal = (m.status || '').toUpperCase();
                if (
                  ['FINISHED', 'TERMINE', 'WAITING_VALIDATION'].includes(
                    statusVal,
                  )
                ) {
                  const s1 = m.scoreTeam1 ?? 0;
                  const s2 = m.scoreTeam2 ?? 0;
                  if (s1 > s2) return { id: m.team1Id, name: m.team1Name };
                  if (s2 > s1) return { id: m.team2Id, name: m.team2Name };
                }

                // Handle automatic qualification (BYE)
                if (
                  (m.team1Id != null || !!m.team1Name) &&
                  m.team2Id == null &&
                  m.team2Name == null
                ) {
                  return { id: m.team1Id, name: m.team1Name };
                }

                return { id: undefined, name: undefined };
              };

              const winner1 = getWinner(p1Match);
              const winner2 = getWinner(p2Match);

              // Virtually populate the match with the inferred winners
              selectedMatch = {
                ...selectedMatch,
                team1Id: selectedMatch.team1Id ?? winner1.id,
                team1Name: selectedMatch.team1Name ?? winner1.name,
                team2Id: selectedMatch.team2Id ?? winner2.id,
                team2Name: selectedMatch.team2Name ?? winner2.name,
              };
            }
          }
        }

        if (!selectedMatch) {
          setError('Match introuvable dans ce tournoi.');
          setLoading(false);
          return;
        }

        const computedMaxRound = Math.max(
          1,
          ...matchList.map((item) =>
            typeof item.round === 'number' && Number.isFinite(item.round)
              ? item.round
              : 1,
          ),
        );
        setMaxRound(computedMaxRound);

        setMatch(selectedMatch);
        await refreshSelections(token);

        if (token) {
          let effectiveResponsibleTeamId: number | null = null;

          const [responsable, myTeam] = await Promise.all([
            isCurrentUserResponsable().catch(() => false),
            getUserTeam().catch(() => null),
          ]);
          effectiveResponsibleTeamId = responsable && myTeam ? myTeam.id : null;
          setResponsibleTeamId(effectiveResponsibleTeamId);
          setUserTeamId(myTeam?.id ?? null);

          const editableTeamIds = [selectedMatch.team1Id, selectedMatch.team2Id]
            .filter((teamId): teamId is number => typeof teamId === 'number')
            .filter((teamId) => teamId === effectiveResponsibleTeamId);

          await Promise.all(
            editableTeamIds.map(async (teamId) => {
              try {
                await loadEditor(teamId, token);
              } catch {
                // Ignore editor loading error here
              }
            }),
          );

          for (const nonEditableTeamId of [
            selectedMatch.team1Id,
            selectedMatch.team2Id,
          ]
            .filter((teamId): teamId is number => typeof teamId === 'number')
            .filter((teamId) => !editableTeamIds.includes(teamId))) {
            setEditorViews((prev) => {
              const next = { ...prev };
              delete next[nonEditableTeamId];
              return next;
            });
          }
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Impossible de charger la page de composition.',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, parsedMatchId, effectiveAdminFlag, loadEditor, refreshSelections]);

  const matchStarted = useMemo(() => {
    if (!match?.scheduledDateTime) return false;
    const timestamp = new Date(match.scheduledDateTime).getTime();
    if (Number.isNaN(timestamp)) return false;
    return Date.now() >= timestamp;
  }, [match?.scheduledDateTime]);

  const isAutoQualifiedMatch = useMemo(() => {
    if (!match) return false;

    // Explicitly check for the presence of each team
    const hasTeam1 = match.team1Id != null || !!match.team1Name;
    const hasTeam2 = match.team2Id != null || !!match.team2Name;

    // It's a BYE (automatic qualification) ONLY IF:
    // - Team 1 is present
    // - Team 2 is completely absent
    // - This theoretically only happens in round 1
    return hasTeam1 && !hasTeam2 && (match.round === 1 || !match.round);
  }, [match]);

  const isPlayableScheduledMatch = useMemo(() => {
    if (!match || isAutoQualifiedMatch) return false;

    const hasTeam1 = match.team1Id != null || !!match.team1Name;
    const hasTeam2 = match.team2Id != null || !!match.team2Name;

    return hasTeam1 && hasTeam2 && !matchStarted;
  }, [match, isAutoQualifiedMatch, matchStarted]);

  const matchResult = useMemo(() => {
    if (!match) return null;
    const { scoreTeam1, scoreTeam2 } = match;
    if (typeof scoreTeam1 !== 'number' || typeof scoreTeam2 !== 'number')
      return null;
    const team1Name = match.team1Name ?? 'Équipe 1';
    const team2Name = match.team2Name ?? 'Équipe 2';
    if (scoreTeam1 === scoreTeam2) {
      return {
        scoreTeam1,
        scoreTeam2,
        winnerName: null,
        isDraw: true,
        team1Name,
        team2Name,
      };
    }
    const winnerName = scoreTeam1 > scoreTeam2 ? team1Name : team2Name;
    return {
      scoreTeam1,
      scoreTeam2,
      winnerName,
      isDraw: false,
      team1Name,
      team2Name,
    };
  }, [match]);

  const userCanForfeit = useMemo(() => {
    if (!match || !responsibleTeamId || isAdmin || isAutoQualifiedMatch)
      return false;
    if (match.status === 'FINISHED') return false;
    return (
      match.team1Id === responsibleTeamId || match.team2Id === responsibleTeamId
    );
  }, [match, responsibleTeamId, isAdmin, isAutoQualifiedMatch]);

  const selectionLocked = useMemo(() => {
    if (!match) return false;

    const normalizedStatus = (match.status ?? '').toUpperCase();
    const isFinishedStatus =
      normalizedStatus === 'FINISHED' ||
      normalizedStatus === 'TERMINE' ||
      normalizedStatus === 'TERMINÉ';

    const hasFinalScore =
      typeof match.scoreTeam1 === 'number' &&
      typeof match.scoreTeam2 === 'number';

    return (
      isAutoQualifiedMatch || matchStarted || isFinishedStatus || hasFinalScore
    );
  }, [match, isAutoQualifiedMatch, matchStarted]);

  const canRequestEditor = (teamId?: number) => {
    if (!teamId) return false;
    if (isAdminView) return false;
    if (selectionLocked) return false;
    const token = getAuthenticatedUser()?.token;
    if (!token) return false;
    return responsibleTeamId === teamId;
  };

  const shouldHideTeamSelection = (teamId?: number): boolean => {
    if (!teamId) return false;
    if (isAdmin) return false;
    if (matchStarted) return false;
    if (userTeamId === teamId) return false;
    return true;
  };

  const toggleMember = (teamId: number, memberId: number) => {
    const editor = editorViews[teamId];
    if (!editor) return;

    const member = editor.members.find(
      (currentMember) => currentMember.memberId === memberId,
    );
    if (member?.unavailable) {
      setFeedback(
        `${member.tag ?? 'Ce joueur'} est indisponible pour la date du match.`,
      );
      return;
    }

    const maxPlayers = editor.maxPlayers ?? 4;
    const currentlySelected = selectedByTeam[teamId] ?? [];
    const alreadySelected = currentlySelected.includes(memberId);

    if (alreadySelected) {
      setSelectedByTeam((prev) => ({
        ...prev,
        [teamId]: currentlySelected.filter((idValue) => idValue !== memberId),
      }));
      return;
    }

    if (currentlySelected.length >= maxPlayers) {
      setFeedback(`Maximum ${maxPlayers} joueurs pour une composition.`);
      return;
    }

    setSelectedByTeam((prev) => ({
      ...prev,
      [teamId]: [...currentlySelected, memberId],
    }));
  };

  const saveTeam = async (teamId: number) => {
    if (!parsedMatchId) return;

    if (isAutoQualifiedMatch) {
      setFeedback(
        "Match qualifié d'office: la composition ne peut pas être modifiée.",
      );
      return;
    }

    const token = getAuthenticatedUser()?.token;
    if (!token) {
      setFeedback('Connecte-toi pour enregistrer la composition.');
      return;
    }

    if (responsibleTeamId !== teamId) {
      setFeedback('Tu ne peux modifier que la composition de ton équipe.');
      return;
    }

    const memberIds = selectedByTeam[teamId] ?? [];
    setSavingTeamId(teamId);
    setFeedback(null);

    try {
      await updateMatchTeamSelection(parsedMatchId, teamId, memberIds, token);
      await Promise.all([refreshSelections(token), loadEditor(teamId, token)]);
      setFeedback('Composition enregistrée avec succès.');
    } catch (e) {
      setFeedback(
        e instanceof Error
          ? e.message
          : 'Impossible de sauvegarder cette composition.',
      );
    } finally {
      setSavingTeamId(null);
    }
  };

  const openForfeitDialog = () => {
    if (!responsibleTeamId || !match) return;
    const teamName =
      match.team1Id === responsibleTeamId
        ? (match.team1Name ?? 'Votre équipe')
        : (match.team2Name ?? 'Votre équipe');
    setForfeitingTeamId(responsibleTeamId);
    setForfeitingTeamName(teamName);
    setForfeitDialogOpen(true);
  };

  const handleConfirmForfeit = async () => {
    const token = getAuthenticatedUser()?.token;
    if (!token || !forfeitingTeamId) return;

    try {
      await declareForfeit(parsedMatchId!, forfeitingTeamId, token);
      setMatch((current) => {
        if (!current) return current;
        const forfeitingIsTeam1 = current.team1Id === forfeitingTeamId;
        return {
          ...current,
          status: 'FINISHED',
          scoreTeam1: forfeitingIsTeam1 ? 0 : 5,
          scoreTeam2: forfeitingIsTeam1 ? 5 : 0,
        };
      });
      setFeedback(
        `L'équipe ${forfeitingTeamName} a déclaré forfait. Score: 0 - 5.`,
      );
      await refreshSelections(token);
      navigate(`/tournois/${id}/matchs`);
    } catch (e) {
      setFeedback(
        e instanceof Error ? e.message : 'Impossible de déclarer forfait.',
      );
    } finally {
      setForfeitDialogOpen(false);
      setForfeitingTeamId(null);
      setForfeitingTeamName('');
    }
  };

  const renderTeamPanel = (
    teamId: number | undefined,
    teamName: string | undefined,
    isWinner: boolean,
  ) => {
    const safeTeamName = teamName ?? 'Équipe';
    const editor = teamId ? editorViews[teamId] : undefined;
    const selectedIds = teamId ? (selectedByTeam[teamId] ?? []) : [];
    const accentColor = '#e8822a';
    const winnerAccent = '#eab308';

    const teamSelections = teamId
      ? selections
          .filter((selection) => selection.teamId === teamId)
          .slice(0, 4)
      : [];

    const hiddenForViewer = shouldHideTeamSelection(teamId);

    return (
      <Card
        sx={{
          flex: 1,
          minWidth: 300,
          borderRadius: 3,
          background:
            'linear-gradient(165deg, rgba(16,24,40,0.95) 0%, rgba(15,23,42,0.88) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': isWinner
            ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: winnerAccent,
              }
            : undefined,
        }}
      >
        <CardContent sx={{ pl: isWinner ? 3 : 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h6"
              fontWeight={800}
              color="white"
              onClick={() => openTeamDetails(teamId)}
              sx={{
                cursor: teamId ? 'pointer' : 'default',
                '&:hover': teamId
                  ? {
                      color: '#e8822a',
                      textDecoration: 'underline',
                    }
                  : undefined,
              }}
            >
              {safeTeamName}
            </Typography>
            {isWinner && (
              <Chip
                icon={<EmojiEventsIcon sx={{ color: '#06111f !important' }} />}
                label="Vainqueur"
                size="small"
                sx={{
                  bgcolor: winnerAccent,
                  color: '#06111f',
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>

          <Divider sx={{ my: 1.75, borderColor: 'rgba(255,255,255,0.12)' }} />

          <Typography
            variant="subtitle2"
            color="rgba(255,255,255,0.75)"
            sx={{ mb: 1 }}
          >
            Composition actuelle
          </Typography>

          {hiddenForViewer ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              La composition adverse sera visible une fois l'heure du match
              arrivée.
            </Alert>
          ) : teamSelections.length === 0 ? (
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.7)"
              sx={{ mb: 2 }}
            >
              Aucune composition enregistrée.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {teamSelections.map((selection) => (
                <Box
                  key={`${selection.memberId}-${selection.teamId}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Avatar
                    src={normalizeImageSrc(selection.memberProfileImageUrl)}
                    alt={selection.memberTag ?? 'Joueur'}
                    sx={{ width: 28, height: 28, cursor: 'pointer' }}
                    onClick={() => openPlayerProfile(selection.memberId)}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      color="white"
                      fontWeight={700}
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => openPlayerProfile(selection.memberId)}
                    >
                      {selection.memberTag ?? 'Joueur'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="rgba(255,255,255,0.65)"
                    >
                      {selection.memberSpecialty ?? 'Spécialité non renseignée'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {teamId && canRequestEditor(teamId) && (
            <Box sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditNoteIcon />}
                onClick={async () => {
                  const token = getAuthenticatedUser()?.token;
                  if (!token) return;
                  try {
                    await loadEditor(teamId, token);
                    setSelectionDialogTeamId(teamId);
                    setSelectionDialogOpen(true);
                  } catch (e) {
                    setFeedback(
                      e instanceof Error
                        ? e.message
                        : 'Impossible de charger les membres éditables.',
                    );
                  }
                }}
                sx={{
                  borderColor: `${accentColor}88`,
                  color: accentColor,
                  '&:hover': {
                    borderColor: accentColor,
                    bgcolor: `${accentColor}22`,
                  },
                }}
              >
                {editor
                  ? `Modifier la composition (${selectedIds.length}/${editor.maxPlayers})`
                  : 'Modifier la composition'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (error || !match) {
    return (
      <Container sx={{ py: 6 }}>
        <BackButton />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error ?? 'Match introuvable.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 4,
        background:
          'radial-gradient(circle at 5% 10%, rgba(251,191,36,0.08), transparent 35%), radial-gradient(circle at 95% 20%, rgba(34,211,238,0.08), transparent 35%)',
      }}
    >
      <Container maxWidth="xl">
        <BackButton />

        <Card
          sx={{
            mt: 2,
            borderRadius: 4,
            bgcolor: 'rgba(10,16,30,0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <Box>
                <Typography
                  variant="overline"
                  color="rgba(255,255,255,0.65)"
                  letterSpacing={1.2}
                >
                  {tournamentName}
                </Typography>
                <Typography
                  variant="h3"
                  color="white"
                  fontWeight={900}
                  sx={{ mt: 0.5, mb: 1 }}
                >
                  {isAutoQualifiedMatch
                    ? "Qualification d'office"
                    : isPlayableScheduledMatch
                      ? 'Match à jouer'
                      : 'Composition des équipes'}
                </Typography>
                <Typography variant="body1" color="rgba(255,255,255,0.72)">
                  {formatDateTime(match.scheduledDateTime)} ·{' '}
                  {getRoundLabelFromMax(match.round ?? 1, maxRound)}
                </Typography>
              </Box>

              {userCanForfeit && (
                <Button
                  variant="outlined"
                  onClick={openForfeitDialog}
                  sx={{
                    color: '#ef4444',
                    borderColor: '#ef4444',
                    py: 1,
                    px: 3,
                    borderRadius: 2,
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      color: 'white',
                    },
                  }}
                >
                  Déclarer forfait
                </Button>
              )}
            </Stack>

            {feedback && (
              <Alert severity="info" sx={{ mb: 4 }}>
                {feedback}
              </Alert>
            )}

            {isPlayableScheduledMatch && (
              <Alert severity="info" sx={{ mb: 4 }}>
                Les deux équipes sont déjà connues : la composition peut être
                préparée avant le coup d'envoi.
              </Alert>
            )}

            {matchResult && !isAutoQualifiedMatch && (
              <Card
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  background:
                    'linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(10,16,30,0.85) 55%, rgba(56,189,248,0.15) 100%)',
                  border: '1px solid rgba(234,179,8,0.35)',
                  boxShadow: '0 18px 45px rgba(234,179,8,0.12)',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={{ xs: 2, sm: 3 }}
                >
                  <Box
                    sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}
                  >
                    <Typography
                      variant="overline"
                      color="rgba(255,255,255,0.7)"
                      letterSpacing={1.5}
                    >
                      Résultat final
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent={{ xs: 'center', sm: 'flex-start' }}
                      sx={{ mt: 1 }}
                    >
                      <Typography
                        variant="h4"
                        onClick={() => openTeamDetails(match.team1Id)}
                        sx={{
                          color:
                            matchResult.isDraw ||
                            matchResult.scoreTeam1 >= matchResult.scoreTeam2
                              ? '#ffffff'
                              : 'rgba(255,255,255,0.5)',
                          fontWeight:
                            matchResult.isDraw ||
                            matchResult.scoreTeam1 >= matchResult.scoreTeam2
                              ? 900
                              : 600,
                          cursor: match.team1Id ? 'pointer' : 'default',
                          '&:hover': match.team1Id
                            ? {
                                color: '#e8822a',
                              }
                            : undefined,
                        }}
                      >
                        {matchResult.team1Name}{' '}
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            color:
                              matchResult.isDraw ||
                              matchResult.scoreTeam1 >= matchResult.scoreTeam2
                                ? '#ffffff'
                                : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {matchResult.scoreTeam1}
                        </Box>
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
                      >
                        —
                      </Typography>
                      <Typography
                        variant="h4"
                        onClick={() => openTeamDetails(match.team2Id)}
                        sx={{
                          color:
                            matchResult.isDraw ||
                            matchResult.scoreTeam2 >= matchResult.scoreTeam1
                              ? '#ffffff'
                              : 'rgba(255,255,255,0.5)',
                          fontWeight:
                            matchResult.isDraw ||
                            matchResult.scoreTeam2 >= matchResult.scoreTeam1
                              ? 900
                              : 600,
                          cursor: match.team2Id ? 'pointer' : 'default',
                          '&:hover': match.team2Id
                            ? {
                                color: '#e8822a',
                              }
                            : undefined,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            mr: 1,
                            color:
                              matchResult.isDraw ||
                              matchResult.scoreTeam2 >= matchResult.scoreTeam1
                                ? '#ffffff'
                                : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {matchResult.scoreTeam2}
                        </Box>
                        {matchResult.team2Name}
                      </Typography>
                    </Stack>
                  </Box>

                  <Chip
                    icon={
                      <EmojiEventsIcon sx={{ color: '#06111f !important' }} />
                    }
                    label={
                      matchResult.isDraw
                        ? 'Match nul'
                        : `Vainqueur : ${matchResult.winnerName}`
                    }
                    sx={{
                      bgcolor: matchResult.isDraw
                        ? 'rgba(148,163,184,0.85)'
                        : '#fde047',
                      color: '#06111f',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      px: 1.25,
                      py: 2.5,
                      borderRadius: 2,
                      boxShadow: '0 8px 20px rgba(234,179,8,0.25)',
                    }}
                  />
                </Stack>
              </Card>
            )}

            {isAutoQualifiedMatch ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Card
                  sx={{
                    maxWidth: 500,
                    width: '100%',
                    textAlign: 'center',
                    p: 5,
                    borderRadius: 4,
                    background:
                      'linear-gradient(145deg, rgba(234,179,8,0.15) 0%, rgba(10,16,30,0.8) 100%)',
                    border: '1px solid rgba(234,179,8,0.4)',
                    boxShadow: '0 12px 40px rgba(234,179,8,0.1)',
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    color="white"
                    onClick={() =>
                      openTeamDetails(match.team1Id ?? match.team2Id)
                    }
                    sx={{
                      mb: 3,
                      cursor:
                        match.team1Id || match.team2Id ? 'pointer' : 'default',
                      '&:hover':
                        match.team1Id || match.team2Id
                          ? {
                              color: '#e8822a',
                              textDecoration: 'underline',
                            }
                          : undefined,
                    }}
                  >
                    {match.team1Name || match.team2Name}
                  </Typography>

                  <Chip
                    label="Qualifiée d'office"
                    sx={{
                      bgcolor: 'rgba(234,179,8,0.2)',
                      color: '#fde047',
                      mb: 4,
                      px: 1,
                      py: 2.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: '1px solid rgba(234,179,8,0.3)',
                    }}
                  />

                  <Typography
                    variant="body1"
                    color="rgba(255,255,255,0.8)"
                    lineHeight={1.6}
                  >
                    Cette équipe passe automatiquement au tour suivant grâce à
                    son placement dans l'arbre du tournoi.
                  </Typography>
                </Card>
              </Box>
            ) : (
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
                {renderTeamPanel(
                  match.team1Id,
                  match.team1Name,
                  matchResult?.winnerName === (match.team1Name ?? 'Équipe 1'),
                )}
                {renderTeamPanel(
                  match.team2Id,
                  match.team2Name,
                  matchResult?.winnerName === (match.team2Name ?? 'Équipe 2'),
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Selection Dialog */}
      {selectionDialogTeamId !== null &&
        (() => {
          const dTeamId = selectionDialogTeamId;
          const dEditor = editorViews[dTeamId];
          const dSelectedIds = selectedByTeam[dTeamId] ?? [];
          const accentColor = '#e8822a';

          return (
            <Dialog
              open={selectionDialogOpen}
              onClose={() => setSelectionDialogOpen(false)}
              fullWidth
              maxWidth="sm"
              PaperProps={{
                sx: {
                  bgcolor: '#0f1729',
                  color: 'white',
                  border: '1px solid rgba(232,130,42,0.35)',
                  borderRadius: 3,
                },
              }}
            >
              <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EditNoteIcon sx={{ color: accentColor }} />
                  <span>Modifier la composition</span>
                  {dEditor && (
                    <Chip
                      label={`${dSelectedIds.length} / ${dEditor.maxPlayers}`}
                      size="small"
                      sx={{
                        bgcolor: accentColor,
                        color: 'white',
                        fontWeight: 700,
                        ml: 1,
                      }}
                    />
                  )}
                </Stack>
              </DialogTitle>

              <DialogContent
                dividers
                sx={{ borderColor: 'rgba(255,255,255,0.1)', p: 1 }}
              >
                {!dEditor ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <CircularProgress size={24} sx={{ color: accentColor }} />
                  </Box>
                ) : (
                  <Stack spacing={0.75} sx={{ p: 1 }}>
                    {!dEditor.canEdit && (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        Composition verrouillée : le match a déjà commencé.
                      </Alert>
                    )}

                    {[...dEditor.members]
                      .sort(
                        (a, b) =>
                          Number(Boolean(a.unavailable)) -
                          Number(Boolean(b.unavailable)),
                      )
                      .map((member) => (
                        <Box
                          key={member.memberId}
                          onClick={() => {
                            if (
                              !member.unavailable &&
                              dEditor.canEdit &&
                              savingTeamId !== dTeamId
                            ) {
                              toggleMember(dTeamId, member.memberId);
                            }
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            cursor:
                              member.unavailable || !dEditor.canEdit
                                ? 'default'
                                : 'pointer',
                            opacity: member.unavailable ? 0.55 : 1,
                            bgcolor: member.unavailable
                              ? 'rgba(148,163,184,0.12)'
                              : dSelectedIds.includes(member.memberId)
                                ? `${accentColor}26`
                                : 'rgba(255,255,255,0.03)',
                            border: member.unavailable
                              ? '1px solid rgba(148,163,184,0.35)'
                              : dSelectedIds.includes(member.memberId)
                                ? `1px solid ${accentColor}77`
                                : '1px solid rgba(255,255,255,0.07)',
                            transition: 'all 0.15s ease',
                            '&:hover':
                              !member.unavailable && dEditor.canEdit
                                ? {
                                    bgcolor: `${accentColor}18`,
                                    borderColor: `${accentColor}55`,
                                  }
                                : undefined,
                          }}
                        >
                          <Checkbox
                            checked={dSelectedIds.includes(member.memberId)}
                            disabled={
                              savingTeamId === dTeamId ||
                              !dEditor.canEdit ||
                              Boolean(member.unavailable)
                            }
                            onChange={() =>
                              toggleMember(dTeamId, member.memberId)
                            }
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              color: 'rgba(255,255,255,0.4)',
                              '&.Mui-checked': { color: accentColor },
                              p: 0.5,
                            }}
                          />
                          <Avatar
                            src={normalizeImageSrc(member.profileImageUrl)}
                            alt={member.tag}
                            sx={{ width: 36, height: 36, cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlayerProfile(member.memberId);
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight={700}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openPlayerProfile(member.memberId);
                              }}
                            >
                              {member.tag}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.55)"
                            >
                              {member.unavailable
                                ? member.unavailableStartDate &&
                                  member.unavailableEndDate
                                  ? `Indisponible du ${formatShortDate(member.unavailableStartDate)} au ${formatShortDate(member.unavailableEndDate)}`
                                  : 'Indisponible pour ce match'
                                : (member.specialty ??
                                  'Spécialité non renseignée')}
                            </Typography>
                          </Box>

                          {dSelectedIds.includes(member.memberId) && (
                            <Chip
                              label="Sélectionné"
                              size="small"
                              sx={{
                                bgcolor: `${accentColor}33`,
                                color: accentColor,
                                fontWeight: 700,
                                fontSize: 10,
                                border: `1px solid ${accentColor}55`,
                              }}
                            />
                          )}
                        </Box>
                      ))}
                  </Stack>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                  onClick={() => setSelectionDialogOpen(false)}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  disabled={savingTeamId === dTeamId || !dEditor?.canEdit}
                  onClick={async () => {
                    await saveTeam(dTeamId);
                    setSelectionDialogOpen(false);
                  }}
                  sx={{
                    bgcolor: accentColor,
                    color: '#06111f',
                    fontWeight: 800,
                    '&:hover': { bgcolor: '#c86e20' },
                    '&.Mui-disabled': { bgcolor: 'rgba(148,163,184,0.4)' },
                  }}
                >
                  {savingTeamId === dTeamId
                    ? 'Enregistrement...'
                    : 'Enregistrer la composition'}
                </Button>
              </DialogActions>
            </Dialog>
          );
        })()}

      {/* Forfeit Confirmation Dialog */}
      <Dialog
        open={forfeitDialogOpen}
        onClose={() => setForfeitDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ef4444', fontWeight: 700 }}>
          Déclarer forfait
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Êtes-vous sûr de vouloir déclarer forfait pour l'équipe{' '}
            <strong style={{ color: 'white' }}>{forfeitingTeamName}</strong> ?
            <br />
            <br />
            Cette action entraînera la défaite de votre équipe dans ce match.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setForfeitDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmForfeit}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              fontWeight: 700,
              '&:hover': { bgcolor: '#dc2626' },
            }}
          >
            Oui, déclarer forfait
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentMatchCompositionPage;
