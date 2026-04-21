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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Groups2Icon from '@mui/icons-material/Groups2';
import EditNoteIcon from '@mui/icons-material/EditNote';
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

          if (adminFlag) {
            setResponsibleTeamId(null);
          } else {
            const [responsable, myTeam] = await Promise.all([
              isCurrentUserResponsable().catch(() => false),
              getUserTeam().catch(() => null),
            ]);
            effectiveResponsibleTeamId =
              responsable && myTeam ? myTeam.id : null;
            setResponsibleTeamId(effectiveResponsibleTeamId);
          }

          const editableTeamIds = [selectedMatch.team1Id, selectedMatch.team2Id]
            .filter((teamId): teamId is number => typeof teamId === 'number')
            .filter((teamId) =>
              adminFlag ? true : teamId === effectiveResponsibleTeamId,
            );

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

  const managedTeamId = useMemo(() => {
    if (!match) return null;
    const candidates = [match.team1Id, match.team2Id];
    return candidates.includes(responsibleTeamId ?? -1)
      ? responsibleTeamId
      : null;
  }, [match, responsibleTeamId]);

  const canRequestEditor = (teamId?: number) => {
    if (!teamId) return false;
    const token = getAuthenticatedUser()?.token;
    if (!token) return false;
    if (isAdmin) return true;
    return responsibleTeamId === teamId;
  };

  const shouldHideTeamSelection = (teamId?: number): boolean => {
    if (!teamId) return false;
    if (isAdmin) return false;
    if (matchStarted) return false;
    if (managedTeamId == null) return true;
    return teamId !== managedTeamId;
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

    const token = getAuthenticatedUser()?.token;
    if (!token) {
      setFeedback('Connecte-toi pour enregistrer la composition.');
      return;
    }

    if (!isAdmin && responsibleTeamId !== teamId) {
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

  const openForfeitDialog = (teamId: number, teamName: string) => {
    setForfeitingTeamId(teamId);
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
      // Refresh the match data
      await refreshSelections(token);
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
    accentColor: string,
  ) => {
    const safeTeamName = teamName ?? 'Équipe';
    const editor = teamId ? editorViews[teamId] : undefined;
    const selectedIds = teamId ? (selectedByTeam[teamId] ?? []) : [];

    const teamSelections = teamId
      ? selections.filter((selection) => selection.teamId === teamId)
      : [];

    const hiddenForViewer = shouldHideTeamSelection(teamId);

    // Only the responsable of this specific team can see the forfeit option
    const canForfeit =
      !isAdmin &&
      teamId !== undefined &&
      responsibleTeamId === teamId &&
      editor !== undefined;

    return (
      <Card
        sx={{
          flex: 1,
          minWidth: 300,
          borderRadius: 3,
          background:
            'linear-gradient(165deg, rgba(16,24,40,0.95) 0%, rgba(15,23,42,0.88) 100%)',
          border: `1px solid ${accentColor}66`,
          boxShadow: `0 12px 30px ${accentColor}22`,
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight={800} color="white">
              {safeTeamName}
            </Typography>
            {teamId && (
              <Chip
                icon={<Groups2Icon />}
                label={`Équipe #${teamId}`}
                sx={{
                  bgcolor: `${accentColor}22`,
                  color: accentColor,
                  border: `1px solid ${accentColor}55`,
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
                    sx={{ width: 28, height: 28 }}
                  />
                  <Box>
                    <Typography variant="body2" color="white" fontWeight={700}>
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
                  {/* Sélection header with forfeit link on the other side */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="subtitle2"
                      color="rgba(255,255,255,0.75)"
                    >
                      Sélection ({selectedIds.length}/{editor.maxPlayers})
                    </Typography>
                    {canForfeit && (
                      <Typography
                        variant="caption"
                        onClick={() => openForfeitDialog(teamId, safeTeamName)}
                        sx={{
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: 900,
                          letterSpacing: '0.02em',
                          '&:hover': {
                            textDecoration: 'underline',
                            opacity: 0.8,
                          },
                        }}
                      >
                        Déclarer forfait
                      </Typography>
                    )}
                  </Stack>

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
                            sx={{ width: 30, height: 30 }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight={700}
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
          {teamId && !canRequestEditor(teamId) && editor && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Tu ne peux modifier que la composition de ton équipe.
            </Alert>
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
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="overline" color="rgba(255,255,255,0.65)">
                  {tournamentName}
                </Typography>
                <Typography variant="h4" color="white" fontWeight={900}>
                  Composition du match #{match.id}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.72)">
                  {formatDateTime(match.scheduledDateTime)} · Tour {match.round}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/tournois/${id}/matchs`)}
                sx={{ color: '#93c5fd', borderColor: 'rgba(147,197,253,0.55)' }}
              >
                Retour au bracket
              </Button>
            </Stack>

            {feedback && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {feedback}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
              {renderTeamPanel(match.team1Id, match.team1Name, '#38bdf8')}
              {renderTeamPanel(match.team2Id, match.team2Name, '#fb7185')}
            </Stack>
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
