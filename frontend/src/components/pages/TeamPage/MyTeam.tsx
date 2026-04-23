import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  ExitToApp as LeaveIcon,
  EmojiEvents,
  Edit as EditIcon,
  Groups as GroupsIcon,
  PersonRemove as PersonRemoveIcon,
  SportsEsports as MatchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  depromoteResponsable,
  getUserTeam,
  isCurrentUserResponsable,
  leaveEquipe,
  promoteResponsable,
  updateTeamImage,
  kickMember,
} from '../../../services/teams';
import { Equipe } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';
import {
  fetchTeamRegistrationsPublic,
  fetchTeamMatches,
  TeamRegistrationItem,
  TeamMatch,
} from '../../../services/tournaments';

// ── Types ──────────────────────────────────────────────────────────────────────
type TournamentFilterState =
  | 'ALL'
  | 'EN_COURS'
  | 'OUVERT'
  | 'CLOTURE'
  | 'TERMINE';

type MatchFilterState = 'ALL' | 'A_JOUER' | 'EN_COURS' | 'TERMINE';

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (value?: string) => {
  if (!value) return 'Date non définie';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Date non définie';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const parseTournamentDate = (date?: string): number => {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const normalizeState = (etat?: string): string => (etat || '').toUpperCase();

const statusLabel: Record<string, string> = {
  BROUILLON: 'Brouillon',
  OUVERT: 'À venir',
  CLOTURE: 'À venir',
  EN_COURS: 'En cours',
  TERMINE: 'Passé',
  ANNULE: 'Annulé',
};

const statusColor: Record<string, string> = {
  BROUILLON: '#64748b',
  OUVERT: '#3b82f6',
  CLOTURE: '#0ea5e9',
  EN_COURS: '#f59e0b',
  TERMINE: '#10b981',
  ANNULE: '#ef4444',
};

// ── Dark select style ──────────────────────────────────────────────────────────
const darkSelectSx = {
  color: 'white',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.18)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.32)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e8822a' },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
};

// ── Composant : liste de tournois avec "Voir tout" ─────────────────────────────
type TournamentSectionProps = {
  title: string;
  registrations: TeamRegistrationItem[];
  emptyMessage: string;
  accentColor: string;
  onNavigate: (id: number) => void;
};

const TournamentSection = ({
  title,
  registrations,
  emptyMessage,
  accentColor,
  onNavigate,
}: TournamentSectionProps) => {
  const [open, setOpen] = useState(false);
  const preview = registrations.slice(0, 3);
  const hasMore = registrations.length > 3;

  const renderList = (items: TeamRegistrationItem[]) => (
    <List disablePadding>
      {items.map((registration, index) => {
        const tournamentState = normalizeState(registration.tournoi?.etat);
        return (
          <Box
            key={`${registration.tournoiId}-${registration.equipeId}-${index}`}
          >
            <ListItem
              sx={{
                py: 1.5,
                px: 1,
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
              onClick={() => onNavigate(registration.tournoiId)}
            >
              <Box>
                <Typography fontWeight={700} color="white">
                  {registration.tournoi?.nom || 'Tournoi sans nom'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.75)">
                  Début : {formatDate(registration.tournoi?.dateDebut)}
                </Typography>
              </Box>
              <Chip
                label={
                  statusLabel[tournamentState] || tournamentState || 'Inconnu'
                }
                size="small"
                sx={{
                  bgcolor: statusColor[tournamentState] || '#334155',
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </ListItem>
            {index < items.length - 1 && (
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
            )}
          </Box>
        );
      })}
    </List>
  );

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: `1px solid ${accentColor}55`,
          background:
            'linear-gradient(120deg, rgba(8,11,20,0.75), rgba(26,37,64,0.55))',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="white">
            {title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={registrations.length}
              size="small"
              sx={{ bgcolor: accentColor, color: 'white', fontWeight: 700 }}
            />
            {hasMore && (
              <Button
                size="small"
                variant="text"
                onClick={() => setOpen(true)}
                sx={{
                  color: accentColor,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: `${accentColor}18` },
                }}
              >
                Voir tout →
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />

        {registrations.length === 0 ? (
          <Typography variant="body2" color="rgba(255,255,255,0.75)">
            {emptyMessage}
          </Typography>
        ) : (
          renderList(preview)
        )}
      </Paper>

      {/* Pop-up "Voir tout" */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#0f1729',
            color: 'white',
            border: `1px solid ${accentColor}44`,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          {title}{' '}
          <Chip
            label={registrations.length}
            size="small"
            sx={{
              bgcolor: accentColor,
              color: 'white',
              fontWeight: 700,
              ml: 1,
            }}
          />
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ borderColor: 'rgba(255,255,255,0.1)', p: 1 }}
        >
          {renderList(registrations)}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Composant : historique des matchs ──────────────────────────────────────────
type MatchHistorySectionProps = {
  teamId: number;
};

const MatchHistorySection = ({ teamId }: MatchHistorySectionProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState<MatchFilterState>('ALL');
  const [matchSearch, setMatchSearch] = useState('');

  useEffect(() => {
    fetchTeamMatches(teamId)
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const aTs = a.scheduledDateTime ? Date.parse(a.scheduledDateTime) : 0;
          const bTs = b.scheduledDateTime ? Date.parse(b.scheduledDateTime) : 0;
          return bTs - aTs; // plus récent en premier
        });
        setMatches(sorted);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [teamId]);

  const getMatchStatus = (m: TeamMatch): Exclude<MatchFilterState, 'ALL'> => {
    const normalizedStatus = (m.status ?? '').toLowerCase();
    const hasScore =
      typeof m.scoreTeam1 === 'number' && typeof m.scoreTeam2 === 'number';

    if (
      hasScore ||
      normalizedStatus === 'termine' ||
      normalizedStatus === 'finished' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'complete'
    ) {
      return 'TERMINE';
    }

    if (
      normalizedStatus === 'en_cours' ||
      normalizedStatus === 'in_progress' ||
      normalizedStatus === 'live' ||
      normalizedStatus === 'playing'
    ) {
      return 'EN_COURS';
    }

    if (
      normalizedStatus === 'a_jouer' ||
      normalizedStatus === 'scheduled' ||
      normalizedStatus === 'upcoming' ||
      normalizedStatus === 'planned'
    ) {
      return 'A_JOUER';
    }

    if (m.scheduledDateTime) {
      const scheduledTime = Date.parse(m.scheduledDateTime);
      if (!Number.isNaN(scheduledTime)) {
        return scheduledTime > Date.now() ? 'A_JOUER' : 'EN_COURS';
      }
    }

    return 'A_JOUER';
  };

  const getMatchStatusLabel = (status: Exclude<MatchFilterState, 'ALL'>) => {
    if (status === 'TERMINE') return 'Terminé';
    if (status === 'EN_COURS') return 'En cours';
    return 'À jouer';
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (matchFilter !== 'ALL' && getMatchStatus(match) !== matchFilter) {
        return false;
      }

      if (matchSearch.trim()) {
        const searchTerm = matchSearch.trim().toLowerCase();
        const names =
          `${match.team1Name ?? ''} ${match.team2Name ?? ''}`.toLowerCase();
        if (!names.includes(searchTerm)) return false;
      }

      return true;
    });
  }, [matches, matchFilter, matchSearch]);

  const preview = filteredMatches.slice(0, 3);
  const hasMore = filteredMatches.length > 3;

  const renderMatch = (m: TeamMatch, index: number, arr: TeamMatch[]) => (
    <Box key={m.id}>
      <ListItem
        sx={{
          py: 1.5,
          px: 1,
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        }}
        onClick={() => navigate(`/tournois/${m.tournamentId}/matchs/${m.id}`)}
      >
        <Box>
          <Typography fontWeight={700} color="white" variant="body2">
            {m.team1Name || `Équipe #${m.team1Id}`} vs{' '}
            {m.team2Name || `Équipe #${m.team2Id}`}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.6)">
            {formatDateTime(m.scheduledDateTime)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {getMatchStatus(m) === 'TERMINE' && (
            <Typography
              variant="body2"
              fontWeight={800}
              sx={{ color: '#f59e0b', fontFamily: 'monospace' }}
            >
              {m.scoreTeam1} – {m.scoreTeam2}
            </Typography>
          )}
          <Chip
            size="small"
            label={getMatchStatusLabel(getMatchStatus(m))}
            sx={{
              bgcolor:
                getMatchStatus(m) === 'TERMINE'
                  ? 'rgba(100,116,139,0.3)'
                  : getMatchStatus(m) === 'EN_COURS'
                    ? 'rgba(245,158,11,0.18)'
                    : 'rgba(59,130,246,0.2)',
              color:
                getMatchStatus(m) === 'TERMINE'
                  ? '#cbd5e1'
                  : getMatchStatus(m) === 'EN_COURS'
                    ? '#fde68a'
                    : '#bfdbfe',
              fontWeight: 700,
            }}
          />
        </Stack>
      </ListItem>
      {index < arr.length - 1 && (
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
      )}
    </Box>
  );

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(99,102,241,0.4)',
          background:
            'linear-gradient(120deg, rgba(8,11,20,0.75), rgba(26,37,64,0.55))',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <MatchIcon sx={{ color: '#818cf8', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="white">
              Historique des matchs
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${filteredMatches.length}/${matches.length}`}
              size="small"
              sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700 }}
            />
            {hasMore && (
              <Button
                size="small"
                variant="text"
                onClick={() => setOpen(true)}
                sx={{
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' },
                }}
              >
                Voir tout →
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <TextField
            size="small"
            placeholder="Rechercher une équipe..."
            value={matchSearch}
            onChange={(event) => setMatchSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <FilterIcon
                  sx={{
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.4)',
                    mr: 0.5,
                  }}
                />
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Matchs
            </InputLabel>
            <Select
              value={matchFilter}
              label="Matchs"
              onChange={(event: SelectChangeEvent<MatchFilterState>) =>
                setMatchFilter(event.target.value as MatchFilterState)
              }
              sx={darkSelectSx}
            >
              <MenuItem value="ALL">Tous</MenuItem>
              <MenuItem value="A_JOUER">À jouer</MenuItem>
              <MenuItem value="EN_COURS">En cours</MenuItem>
              <MenuItem value="TERMINE">Terminés</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} sx={{ color: '#6366f1' }} />
          </Box>
        ) : filteredMatches.length === 0 ? (
          <Typography variant="body2" color="rgba(255,255,255,0.75)">
            Aucun match ne correspond aux filtres.
          </Typography>
        ) : (
          <List disablePadding>
            {preview.map((m, i, arr) => renderMatch(m, i, arr))}
          </List>
        )}
      </Paper>

      {/* Pop-up tous les matchs */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#0f1729',
            color: 'white',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Tous les matchs{' '}
          <Chip
            label={`${filteredMatches.length}/${matches.length}`}
            size="small"
            sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700, ml: 1 }}
          />
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ borderColor: 'rgba(255,255,255,0.1)', p: 1 }}
        >
          {filteredMatches.length === 0 ? (
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.75)"
              sx={{ p: 2 }}
            >
              Aucun match ne correspond aux filtres.
            </Typography>
          ) : (
            <List disablePadding>
              {filteredMatches.map((m, i, arr) => renderMatch(m, i, arr))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Composant principal ────────────────────────────────────────────────────────
export function MyTeam() {
  const pageBlueGradient =
    'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

  const navigate = useNavigate();
  const [team, setTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<'success' | 'error'>(
    'success',
  );
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<
    number | null
  >(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSimpleLeaveDialogOpen, setIsSimpleLeaveDialogOpen] = useState(false);
  const [replacementResponsibleId, setReplacementResponsibleId] = useState<
    number | null
  >(null);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [pendingPromoteMember, setPendingPromoteMember] = useState<{
    id: number;
    tag?: string;
  } | null>(null);
  const [teamRegistrations, setTeamRegistrations] = useState<
    TeamRegistrationItem[]
  >([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(
    null,
  );
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const teamImages = [
    'akatsuki.jpg',
    'espada.jpg',
    'fairytail.jpg',
    'hunter.jpg',
    'onepiece.jpg',
  ];
  const [selectedNewImage, setSelectedNewImage] = useState(teamImages[0]);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false);
  const [pendingKickMember, setPendingKickMember] = useState<{
    id: number;
    tag?: string;
  } | null>(null);
  const [isMemberActionLoading, setIsMemberActionLoading] = useState(false);

  // ── Filtre tournois ──────────────────────────────────────────────────────────
  const [tournamentFilter, setTournamentFilter] =
    useState<TournamentFilterState>('ALL');
  const [tournamentSearch, setTournamentSearch] = useState('');

  const currentUserId = (() => {
    const token = getAuthenticatedUser()?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  const handleAuthFailure = useCallback(
    (err: unknown): boolean => {
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.includes('Session expirée') ||
        errorMessage.includes('Utilisateur non authentifié')
      ) {
        navigate('/login');
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadMyTeam = useCallback(async () => {
    setRegistrationsLoading(true);
    setRegistrationsError(null);
    try {
      const [myTeam, responsable] = await Promise.all([
        getUserTeam(),
        isCurrentUserResponsable(),
      ]);
      setTeam(myTeam);
      setIsResponsable(responsable);

      if (myTeam?.id) {
        const token = getAuthenticatedUser()?.token;
        if (token) {
          try {
            const registrations = await fetchTeamRegistrationsPublic(myTeam.id);
            setTeamRegistrations(registrations);
          } catch {
            setRegistrationsError(
              "Impossible de charger l'historique des tournois pour le moment.",
            );
            setTeamRegistrations([]);
          }
        } else {
          setTeamRegistrations([]);
        }
      } else {
        setTeamRegistrations([]);
      }
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessage('Impossible de charger votre équipe pour le moment.');
      setTeamRegistrations([]);
    } finally {
      setLoading(false);
      setRegistrationsLoading(false);
    }
  }, [handleAuthFailure]);

  useEffect(() => {
    loadMyTeam();
  }, [loadMyTeam]);

  // ── Registrations filtrées ───────────────────────────────────────────────────
  const registrationsSorted = useMemo(
    () =>
      [...teamRegistrations].sort(
        (a, b) =>
          parseTournamentDate(a.tournoi?.dateDebut) -
          parseTournamentDate(b.tournoi?.dateDebut),
      ),
    [teamRegistrations],
  );

  const filteredRegistrations = useMemo(() => {
    return registrationsSorted.filter((r) => {
      const etat = normalizeState(r.tournoi?.etat);
      if (tournamentFilter !== 'ALL' && etat !== tournamentFilter) return false;
      if (tournamentSearch.trim()) {
        const name = (r.tournoi?.nom || '').toLowerCase();
        if (!name.includes(tournamentSearch.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [registrationsSorted, tournamentFilter, tournamentSearch]);

  const inProgressRegistrations = useMemo(
    () =>
      filteredRegistrations.filter(
        (r) => normalizeState(r.tournoi?.etat) === 'EN_COURS',
      ),
    [filteredRegistrations],
  );

  const upcomingRegistrations = useMemo(
    () =>
      filteredRegistrations.filter((r) => {
        const etat = normalizeState(r.tournoi?.etat);
        return etat === 'OUVERT' || etat === 'CLOTURE' || etat === 'BROUILLON';
      }),
    [filteredRegistrations],
  );

  const pastRegistrations = useMemo(
    () =>
      filteredRegistrations
        .filter((r) => normalizeState(r.tournoi?.etat) === 'TERMINE')
        .sort(
          (a, b) =>
            parseTournamentDate(b.tournoi?.dateDebut) -
            parseTournamentDate(a.tournoi?.dateDebut),
        ),
    [filteredRegistrations],
  );

  // ── Handlers (inchangés) ─────────────────────────────────────────────────────
  const handleLeaveTeam = async () => {
    if (!team) return;
    const otherMembers = team.members.filter((m) => m.id !== currentUserId);
    const responsablesCount = team.members.filter(
      (m) => m.isResponsable,
    ).length;
    const mustChooseReplacement = isResponsable && responsablesCount === 1;
    if (mustChooseReplacement && otherMembers.length > 0) {
      setReplacementResponsibleId(null);
      setIsLeaveDialogOpen(true);
      return;
    }
    setIsSimpleLeaveDialogOpen(true);
  };

  const handleConfirmSimpleLeaveTeam = async () => {
    if (!team) return;
    try {
      await leaveEquipe();
      setTeam(null);
      setIsResponsable(false);
      setIsSimpleLeaveDialogOpen(false);
      setMessageSeverity('success');
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
      );
    }
  };

  const handleConfirmLeaveTeam = async () => {
    if (!team || !replacementResponsibleId) {
      setMessageSeverity('error');
      setMessage('Vous devez choisir un nouveau responsable avant de quitter.');
      return;
    }
    try {
      await leaveEquipe(undefined, replacementResponsibleId);
      setTeam(null);
      setIsResponsable(false);
      setIsLeaveDialogOpen(false);
      setReplacementResponsibleId(null);
      setMessageSeverity('success');
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
      );
    }
  };

  const handlePromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await promoteResponsable(memberId);
      await loadMyTeam();
      setMessageSeverity('success');
      setMessage(`${memberTag || 'Le membre'} est maintenant responsable.`);
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de nommer ce membre responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const openPromoteConfirm = (memberId: number, memberTag?: string) => {
    setPendingPromoteMember({ id: memberId, tag: memberTag });
    setPromoteConfirmOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!pendingPromoteMember) return;
    setPromoteConfirmOpen(false);
    await handlePromote(pendingPromoteMember.id, pendingPromoteMember.tag);
    setPendingPromoteMember(null);
  };

  const handleDepromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await depromoteResponsable(memberId);
      await loadMyTeam();
      setMessageSeverity('success');
      setMessage(`${memberTag || 'Le membre'} n'est plus responsable.`);
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de retirer ce responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const openKickConfirm = (memberId: number, memberTag?: string) => {
    setPendingKickMember({ id: memberId, tag: memberTag });
    setKickConfirmOpen(true);
  };

  const handleConfirmKick = async () => {
    if (!pendingKickMember) return;
    setIsMemberActionLoading(true);
    try {
      await kickMember(pendingKickMember.id);
      await loadMyTeam();
      setKickConfirmOpen(false);
      setPendingKickMember(null);
      setMessageSeverity('success');
      setMessage(
        `${pendingKickMember.tag || 'Le membre'} a été exclu de l'équipe.`,
      );
      window.dispatchEvent(new Event('team-membership-changed'));
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessageSeverity('error');
      setMessage(
        err instanceof Error ? err.message : "Impossible d'exclure ce membre.",
      );
    } finally {
      setIsMemberActionLoading(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!team) return;
    setIsUpdatingImage(true);
    try {
      await updateTeamImage(team.id, selectedNewImage);
      await loadMyTeam();
      setIsImageDialogOpen(false);
    } catch (err: unknown) {
      if (handleAuthFailure(err)) return;
      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de l'image.",
      );
    } finally {
      setIsUpdatingImage(false);
    }
  };

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageBlueGradient,
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageBlueGradient,
          p: 3,
        }}
      >
        <Alert severity="info">Vous n&apos;êtes dans aucune équipe.</Alert>
      </Box>
    );
  }

  const otherMembers = team.members.filter((m) => m.id !== currentUserId);
  const responsablesCount = team.members.filter((m) => m.isResponsable).length;
  const canPromoteMore = responsablesCount < 2;
  const sortedMembers = [...team.members].sort((a, b) => {
    if (a.isResponsable !== b.isResponsable)
      return (b.isResponsable ? 1 : 0) - (a.isResponsable ? 1 : 0);
    return (a.tag || '').localeCompare(b.tag || '', 'fr', {
      sensitivity: 'base',
    });
  });

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        background: pageBlueGradient,
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        {message && (
          <Alert severity={messageSeverity} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* HEADER BANNER */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 2,
            bgcolor: '#1a2540',
            color: 'white',
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative' }}>
              {team.profileImage && (
                <Avatar
                  src={`/${team.profileImage}`}
                  alt={team.name}
                  variant="rounded"
                  sx={{
                    width: 90,
                    height: 90,
                    border: '3px solid #e8822a',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                />
              )}
              {isResponsable && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setIsImageDialogOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#1a2540',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: 'auto',
                    p: 0.5,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#e8822a' },
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Membre de l'équipe
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {team.name}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupsIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">
                    {team.members.length} Membres
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5}>
            {isResponsable && (
              <>
                <Button
                  variant="contained"
                  onClick={() => navigate('/equipes/demande')}
                  sx={{
                    bgcolor: '#e8822a',
                    color: 'white',
                    '&:hover': { bgcolor: '#c86e20' },
                  }}
                >
                  Demandes d'adhésion
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EmojiEvents />}
                  onClick={() => navigate('/tournois/gestion')}
                  sx={{
                    bgcolor: '#22c55e',
                    color: 'white',
                    '&:hover': { bgcolor: '#16a34a' },
                  }}
                >
                  Gérer sélection
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<LeaveIcon />}
              onClick={handleLeaveTeam}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgb(226,10,10)',
                  borderColor: '#c86e20',
                },
              }}
            >
              Quitter l'équipe
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* MEMBRES */}
          <Box
            role="list"
            aria-label="team-members-list"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {sortedMembers.map((member) => (
              <Paper
                key={member.id}
                role="listitem"
                onClick={() => navigate(`/players/${member.id}`)}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: '#1a2540',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: member.isResponsable
                      ? '#e8822a'
                      : 'rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(26,37,64,0.8)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  },
                }}
              >
                <Avatar
                  src={member.profileImageUrl || member.profileImage}
                  alt={member.tag}
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 1.5,
                    border: '3px solid rgba(255,255,255,0.15)',
                    transition: 'transform 0.3s ease',
                  }}
                />
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="white"
                  sx={{ mb: 0.5 }}
                >
                  {member.tag}
                </Typography>
                {member.id === currentUserId && (
                  <Chip
                    label="Moi"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(59,130,246,0.16)',
                      color: '#93c5fd',
                      fontWeight: 700,
                      mb: 1,
                    }}
                  />
                )}
                <Chip
                  label={
                    member.specialty
                      ? member.specialty.charAt(0).toUpperCase() +
                        member.specialty.slice(1)
                      : 'Membre'
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: 11,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.25)',
                    mb: 1,
                  }}
                />
                <Chip
                  label={member.isResponsable ? 'Responsable' : 'Membre'}
                  size="small"
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: member.isResponsable ? '#e8822a' : '#334155',
                    color: 'white',
                    mt: 1.5,
                    mb: 2,
                  }}
                />
                {isResponsable && member.id !== currentUserId && (
                  <Box
                    sx={{ width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FormControlLabel
                      sx={{ width: '100%', mt: 0.5, mx: 0, mr: 0 }}
                      control={
                        <Switch
                          checked={member.isResponsable}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (typeof member.id !== 'number') return;
                            if (member.isResponsable)
                              handleDepromote(member.id, member.tag);
                            else openPromoteConfirm(member.id, member.tag);
                          }}
                          disabled={
                            memberActionLoadingId === member.id ||
                            (!member.isResponsable && !canPromoteMore)
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#e8822a',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              { backgroundColor: '#e8822a' },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="caption"
                          color="white"
                          sx={{ fontSize: 11 }}
                        >
                          {member.isResponsable ? 'Responsable' : 'Promouvoir'}
                        </Typography>
                      }
                    />
                    <Tooltip title="Bannir le membre">
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonRemoveIcon sx={{ fontSize: 13 }} />}
                          aria-label="Exclure de l'équipe"
                          disabled={
                            memberActionLoadingId === member.id ||
                            isMemberActionLoading
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof member.id !== 'number') return;
                            openKickConfirm(member.id, member.tag);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            width: '40px',
                            minWidth: '40px',
                            padding: '6px',
                            justifyContent: 'center',
                            color: '#ef4444',
                            borderColor: 'rgba(239,68,68,0.4)',
                            mt: 0.5,
                            '& .MuiButton-startIcon': {
                              marginRight: '6px',
                              marginLeft: 0,
                            },
                            '&:hover': {
                              bgcolor: 'rgba(239,68,68,0.1)',
                              borderColor: '#ef4444',
                            },
                          }}
                        />
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>

          {/* COLONNE DROITE : tournois + matchs */}
          <Stack spacing={3}>
            {/* ── BLOC TOURNOIS avec filtre ───────────────────── */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: '#1a2540',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {/* Titre + filtre */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700} color="white">
                  Historique des tournois
                </Typography>
                <Chip
                  label={teamRegistrations.length}
                  size="small"
                  sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700 }}
                />
              </Stack>

              {/* Filtre rapide */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <TextField
                  size="small"
                  placeholder="Rechercher un tournoi..."
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <FilterIcon
                        sx={{
                          fontSize: 18,
                          color: 'rgba(255,255,255,0.4)',
                          mr: 0.5,
                        }}
                      />
                    ),
                  }}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.32)',
                      },
                      '&.Mui-focused fieldset': { borderColor: '#e8822a' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    État
                  </InputLabel>
                  <Select
                    value={tournamentFilter}
                    label="État"
                    onChange={(e: SelectChangeEvent<TournamentFilterState>) =>
                      setTournamentFilter(
                        e.target.value as TournamentFilterState,
                      )
                    }
                    sx={darkSelectSx}
                  >
                    <MenuItem value="ALL">Tous</MenuItem>
                    <MenuItem value="EN_COURS">En cours</MenuItem>
                    <MenuItem value="OUVERT">À venir (Ouvert)</MenuItem>
                    <MenuItem value="CLOTURE">À venir (Clôturé)</MenuItem>
                    <MenuItem value="TERMINE">Passés</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {registrationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress color="secondary" size={24} />
                </Box>
              ) : registrationsError ? (
                <Alert severity="warning">{registrationsError}</Alert>
              ) : (
                <>
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'EN_COURS') && (
                    <TournamentSection
                      title="En cours"
                      registrations={inProgressRegistrations}
                      emptyMessage="Aucun tournoi en cours."
                      accentColor="#f59e0b"
                      onNavigate={(id) => navigate(`/tournois/${id}`)}
                    />
                  )}
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'OUVERT' ||
                    tournamentFilter === 'CLOTURE') && (
                    <TournamentSection
                      title="À venir"
                      registrations={upcomingRegistrations}
                      emptyMessage="Aucun tournoi à venir."
                      accentColor="#3b82f6"
                      onNavigate={(id) => navigate(`/tournois/${id}`)}
                    />
                  )}
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'TERMINE') && (
                    <TournamentSection
                      title="Passés"
                      registrations={pastRegistrations}
                      emptyMessage="Aucun tournoi passé."
                      accentColor="#10b981"
                      onNavigate={(id) => navigate(`/tournois/${id}`)}
                    />
                  )}
                </>
              )}
            </Paper>

            {/* ── BLOC MATCHS ─────────────────────────────────── */}
            <MatchHistorySection teamId={team.id} />
          </Stack>
        </Box>
      </Container>

      {/* ── DIALOGS (inchangés) ────────────────────────────────────────────────── */}
      <Dialog
        open={isImageDialogOpen}
        onClose={() => !isUpdatingImage && setIsImageDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}
        >
          Modifier l'emblème de l'équipe
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mt: 2,
            }}
          >
            {teamImages.map((img) => (
              <Box
                key={img}
                component="img"
                src={`/${img}`}
                alt={`Emblème ${img}`}
                onClick={() => setSelectedNewImage(img)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border:
                    selectedNewImage === img
                      ? '3px solid #e8822a'
                      : '3px solid transparent',
                  opacity: selectedNewImage === img ? 1 : 0.5,
                  transition: 'all 0.2s ease-in-out',
                  objectFit: 'cover',
                  '&:hover': { transform: 'scale(1.1)', opacity: 1 },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mt: 2, pb: 2 }}>
          <Button
            onClick={() => setIsImageDialogOpen(false)}
            disabled={isUpdatingImage}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              mr: 2,
              '&:hover': { bgcolor: '#080b14' },
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateImage}
            disabled={isUpdatingImage || selectedNewImage === team.profileImage}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isUpdatingImage ? 'Modification...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSimpleLeaveDialogOpen}
        onClose={() => setIsSimpleLeaveDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Quitter l&apos;équipe
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Êtes-vous sûr de vouloir quitter {team.name} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsSimpleLeaveDialogOpen(false)}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSimpleLeaveTeam}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
          >
            Quitter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Choisir un nouveau responsable
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Avant de quitter l'équipe, vous devez désigner un autre responsable.
          </Typography>
          <RadioGroup
            value={replacementResponsibleId?.toString() || ''}
            onChange={(e) =>
              setReplacementResponsibleId(Number(e.target.value))
            }
          >
            {otherMembers.map((member) => (
              <FormControlLabel
                key={member.id}
                value={member.id?.toString() || ''}
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      '&.Mui-checked': { color: '#e8822a' },
                    }}
                  />
                }
                label={`${member.tag} (${member.specialty ? member.specialty.charAt(0).toUpperCase() + member.specialty.slice(1) : 'Membre'})`}
                sx={{ color: 'white' }}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsLeaveDialogOpen(false)}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmLeaveTeam}
            disabled={!replacementResponsibleId}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promoteConfirmOpen}
        onClose={() => {
          setPromoteConfirmOpen(false);
          setPendingPromoteMember(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmer la promotion</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment nommer{' '}
            <strong>{pendingPromoteMember?.tag || 'ce membre'}</strong>{' '}
            responsable ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPromoteConfirmOpen(false);
              setPendingPromoteMember(null);
            }}
          >
            Annuler
          </Button>
          <Button variant="contained" onClick={handleConfirmPromote}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={kickConfirmOpen}
        onClose={() => {
          if (!isMemberActionLoading) {
            setKickConfirmOpen(false);
            setPendingKickMember(null);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(239,68,68,0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ef4444', fontWeight: 700 }}>
          Exclure un membre
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Êtes-vous sûr de vouloir exclure{' '}
            <strong style={{ color: 'white' }}>
              {pendingKickMember?.tag || 'ce membre'}
            </strong>{' '}
            de l&apos;équipe ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setKickConfirmOpen(false);
              setPendingKickMember(null);
            }}
            disabled={isMemberActionLoading}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmKick}
            disabled={isMemberActionLoading}
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              '&:hover': { bgcolor: '#dc2626' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(239,68,68,0.3)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isMemberActionLoading ? 'Exclusion...' : 'Exclure'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
