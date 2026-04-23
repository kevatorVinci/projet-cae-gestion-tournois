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
  FormControlLabel,
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

        const selectedMatch =
          matchList.find((item) => toMatchId(item.id) === parsedMatchId) ??
          null;

        if (!selectedMatch) {
          setError('Match introuvable dans ce tournoi.');
          setLoading(false);
          return;
        }

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
    return match.team1Id == null || match.team2Id == null;
  }, [match]);

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
    return (
      match.team1Id === responsibleTeamId || match.team2Id === responsibleTeamId
    );
  }, [match, responsibleTeamId, isAdmin, isAutoQualifiedMatch]);

  const canRequestEditor = (teamId?: number) => {
    if (!teamId) return false;
    if (isAdminView) return false;
    if (isAutoQualifiedMatch) return false;
    if (matchStarted) return false;
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
      ? selections.filter((selection) => selection.teamId === teamId)
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
            <Typography variant="h6" fontWeight={800} color="white">
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
              {!editor ? (
                <Button
                  variant="outlined"
                  startIcon={<EditNoteIcon />}
                  onClick={async () => {
                    const token = getAuthenticatedUser()?.token;
                    if (!token) return;
                    try {
                      await loadEditor(teamId, token);
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
                  Charger les membres
                </Button>
              ) : (
                <Stack spacing={1.25}>
                  <Typography
                    variant="subtitle2"
                    color="rgba(255,255,255,0.75)"
                  >
                    Sélection ({selectedIds.length}/{editor.maxPlayers})
                  </Typography>

                  {editor.members.map((member) => (
                    <FormControlLabel
                      key={member.memberId}
                      sx={{
                        m: 0,
                        px: 1,
                        py: 0.6,
                        borderRadius: 1.5,
                        bgcolor: selectedIds.includes(member.memberId)
                          ? `${accentColor}26`
                          : 'rgba(255,255,255,0.04)',
                        border: selectedIds.includes(member.memberId)
                          ? `1px solid ${accentColor}77`
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                      control={
                        <Checkbox
                          checked={selectedIds.includes(member.memberId)}
                          onChange={() => toggleMember(teamId, member.memberId)}
                          disabled={savingTeamId === teamId || !editor.canEdit}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={normalizeImageSrc(member.profileImageUrl)}
                            alt={member.tag}
                            sx={{ width: 30, height: 30, cursor: 'pointer' }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openPlayerProfile(member.memberId);
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight={700}
                              sx={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openPlayerProfile(member.memberId);
                              }}
                            >
                              {member.tag}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.65)"
                            >
                              {member.specialty ?? 'Spécialité non renseignée'}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                    />
                  ))}

                  {!editor.canEdit && (
                    <Alert severity="warning">
                      Composition verrouillée: le match a déjà commencé.
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    onClick={() => saveTeam(teamId)}
                    disabled={
                      savingTeamId === teamId ||
                      !editor.canEdit ||
                      !canRequestEditor(teamId)
                    }
                    sx={{
                      bgcolor: accentColor,
                      color: '#06111f',
                      fontWeight: 800,
                      '&:hover': { bgcolor: accentColor },
                      '&.Mui-disabled': { bgcolor: 'rgba(148,163,184,0.4)' },
                    }}
                  >
                    {savingTeamId === teamId
                      ? 'Enregistrement...'
                      : 'Enregistrer la composition'}
                  </Button>
                </Stack>
              )}
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
                    : 'Composition des équipes'}
                </Typography>
                <Typography variant="body1" color="rgba(255,255,255,0.72)">
                  {formatDateTime(match.scheduledDateTime)} · Tour {match.round}
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
                    sx={{ mb: 3 }}
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
