import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
} from '@mui/material';
import {
  AddCircleOutline as CreateIcon,
  GroupAdd as JoinIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsMartialArts as SportsMartialArtsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType } from '../../../types';
import { getUserTeam } from '../../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
  TeamMatch,
} from '../../../services/tournaments';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';
import BackButton from '../../BackButton';

// ── Types ──────────────────────────────────────────────────────────────────────
type TournamentEtat =
  | 'ALL'
  | 'EN_COURS'
  | 'TERMINE'
  | 'OUVERT'
  | 'CLOTURE'
  | 'ANNULE';
type MatchOutcome = 'ALL' | 'VICTOIRE' | 'DEFAITE' | 'NUL';

// ── Helpers ────────────────────────────────────────────────────────────────────
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

const darkTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
    '&.Mui-focused fieldset': { borderColor: '#e8822a' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255,255,255,0.4)',
  },
};

const PREVIEW_LIMIT = 5;

// ── Composant pop-up tournois ──────────────────────────────────────────────────
type TournoiDialogProps = {
  open: boolean;
  onClose: () => void;
  tournaments: { id: number; nom: string; etat?: string; dateDebut?: string }[];
  onNavigate: (id: number) => void;
  formatDate: (v?: string) => string;
};

const TournoiDialog = ({
  open,
  onClose,
  tournaments,
  onNavigate,
  formatDate,
}: TournoiDialogProps) => {
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState<TournamentEtat>('ALL');

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (etatFilter !== 'ALL' && t.etat !== etatFilter) return false;
      if (
        search.trim() &&
        !t.nom.toLowerCase().includes(search.trim().toLowerCase())
      )
        return false;
      return true;
    });
  }, [tournaments, search, etatFilter]);

  const chipColor = (etat?: string) => {
    if (etat === 'EN_COURS') return '#e8822a';
    if (etat === 'TERMINE') return '#10b981';
    if (etat === 'ANNULE') return '#ef4444';
    return '#3b82f6';
  };

  const etatLabel = (etat?: string) => {
    const map: Record<string, string> = {
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      CLOTURE: 'Clôturé',
      OUVERT: 'Ouvert',
    };
    return etat ? (map[etat] ?? etat) : 'Inconnu';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: '#0f1729',
          color: 'white',
          border: '1px solid rgba(232,130,42,0.3)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmojiEventsIcon sx={{ color: '#e8822a' }} />
          <span>Tous les tournois</span>
          <Chip
            label={filtered.length}
            size="small"
            sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700, ml: 1 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Filtres */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher un tournoi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={darkTextFieldSx}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>
              État
            </InputLabel>
            <Select
              value={etatFilter}
              label="État"
              onChange={(e: SelectChangeEvent<TournamentEtat>) =>
                setEtatFilter(e.target.value as TournamentEtat)
              }
              sx={darkSelectSx}
            >
              <MenuItem value="ALL">Tous</MenuItem>
              <MenuItem value="EN_COURS">En cours</MenuItem>
              <MenuItem value="OUVERT">Ouvert</MenuItem>
              <MenuItem value="CLOTURE">Clôturé</MenuItem>
              <MenuItem value="TERMINE">Terminé</MenuItem>
              <MenuItem value="ANNULE">Annulé</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Liste */}
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.4)"
            sx={{ textAlign: 'center', py: 3 }}
          >
            Aucun tournoi trouvé.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((t) => {
              const color = chipColor(t.etat);
              return (
                <Box
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onNavigate(t.id);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onNavigate(t.id);
                      onClose();
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': {
                      borderColor: color,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="white">
                      {t.nom}
                    </Typography>
                    {t.dateDebut && (
                      <Typography
                        variant="caption"
                        color="rgba(255,255,255,0.45)"
                      >
                        {formatDate(t.dateDebut)}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={etatLabel(t.etat)}
                    size="small"
                    sx={{
                      bgcolor: `${color}22`,
                      color,
                      fontWeight: 700,
                      fontSize: 10,
                      border: `1px solid ${color}44`,
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: '#e8822a', color: '#e8822a' },
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Composant pop-up matchs ────────────────────────────────────────────────────
type MatchDialogProps = {
  open: boolean;
  onClose: () => void;
  matches: TeamMatch[];
  team: Equipe | null;
  participatedTournaments: {
    id: number;
    nom: string;
    etat?: string;
    dateDebut?: string;
  }[];
  onNavigate: (tournamentId: number, matchId: number) => void;
  formatDateTime: (v?: string) => string;
};

const MatchDialog = ({
  open,
  onClose,
  matches,
  team,
  participatedTournaments,
  onNavigate,
  formatDateTime,
}: MatchDialogProps) => {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<MatchOutcome>('ALL');

  const getOutcome = (
    match: TeamMatch,
  ): { label: string; color: string; bg: string; border: string } => {
    const isTeam1 = team?.id != null && match.team1Id === team.id;
    const isTeam2 = team?.id != null && match.team2Id === team.id;
    const hasScore =
      typeof match.scoreTeam1 === 'number' &&
      typeof match.scoreTeam2 === 'number';

    if (!hasScore || (!isTeam1 && !isTeam2)) {
      return {
        label: 'Résultat indisponible',
        color: '#94a3b8',
        bg: 'rgba(148,163,184,0.20)',
        border: '1px solid rgba(148,163,184,0.35)',
      };
    }

    const myScore = isTeam1
      ? Number(match.scoreTeam1)
      : Number(match.scoreTeam2);
    const oppScore = isTeam1
      ? Number(match.scoreTeam2)
      : Number(match.scoreTeam1);

    if (myScore > oppScore)
      return {
        label: 'Victoire',
        color: '#34d399',
        bg: 'rgba(16,185,129,0.20)',
        border: '1px solid rgba(16,185,129,0.35)',
      };
    if (myScore < oppScore)
      return {
        label: 'Défaite',
        color: '#f87171',
        bg: 'rgba(239,68,68,0.20)',
        border: '1px solid rgba(239,68,68,0.35)',
      };
    return {
      label: 'Nul',
      color: '#93c5fd',
      bg: 'rgba(59,130,246,0.20)',
      border: '1px solid rgba(59,130,246,0.35)',
    };
  };

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (outcomeFilter !== 'ALL') {
        const { label } = getOutcome(m);
        const map: Record<MatchOutcome, string> = {
          ALL: '',
          VICTOIRE: 'Victoire',
          DEFAITE: 'Défaite',
          NUL: 'Nul',
        };
        if (label !== map[outcomeFilter]) return false;
      }
      if (search.trim()) {
        const t1 = (m.team1Name ?? '').toLowerCase();
        const t2 = (m.team2Name ?? '').toLowerCase();
        const tName = (
          participatedTournaments.find((t) => t.id === m.tournamentId)?.nom ??
          ''
        ).toLowerCase();
        if (
          !t1.includes(search.toLowerCase()) &&
          !t2.includes(search.toLowerCase()) &&
          !tName.includes(search.toLowerCase())
        )
          return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, search, outcomeFilter, team, participatedTournaments]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: '#0f1729',
          color: 'white',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SportsMartialArtsIcon sx={{ color: '#3b82f6' }} />
          <span>Tous les matchs</span>
          <Chip
            label={filtered.length}
            size="small"
            sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 700, ml: 1 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Filtres */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Équipe ou tournoi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={darkTextFieldSx}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Résultat
            </InputLabel>
            <Select
              value={outcomeFilter}
              label="Résultat"
              onChange={(e: SelectChangeEvent<MatchOutcome>) =>
                setOutcomeFilter(e.target.value as MatchOutcome)
              }
              sx={darkSelectSx}
            >
              <MenuItem value="ALL">Tous</MenuItem>
              <MenuItem value="VICTOIRE">Victoire</MenuItem>
              <MenuItem value="DEFAITE">Défaite</MenuItem>
              <MenuItem value="NUL">Nul</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Liste */}
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.4)"
            sx={{ textAlign: 'center', py: 3 }}
          >
            Aucun match trouvé.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((match) => {
              const isTeam1 = team?.id != null && match.team1Id === team.id;
              const isTeam2 = team?.id != null && match.team2Id === team.id;
              const matchTitle = isTeam1
                ? `vs ${match.team2Name ?? '?'}`
                : isTeam2
                  ? `vs ${match.team1Name ?? '?'}`
                  : `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;
              const tournamentName =
                participatedTournaments.find((t) => t.id === match.tournamentId)
                  ?.nom ?? `Tournoi #${match.tournamentId}`;
              const hasScore =
                typeof match.scoreTeam1 === 'number' &&
                typeof match.scoreTeam2 === 'number';
              const score1 = Number(match.scoreTeam1);
              const score2 = Number(match.scoreTeam2);
              const scoreLabel = hasScore
                ? isTeam1
                  ? `${score1} - ${score2}`
                  : isTeam2
                    ? `${score2} - ${score1}`
                    : `${score1} - ${score2}`
                : 'Score indisponible';
              const outcome = getOutcome(match);

              return (
                <Box
                  key={match.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onNavigate(match.tournamentId, match.id);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onNavigate(match.tournamentId, match.id);
                      onClose();
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="white">
                      {matchTitle}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="rgba(255,255,255,0.45)"
                    >
                      {tournamentName}
                      {match.round != null ? ` · Tour ${match.round}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="caption"
                      color="rgba(255,255,255,0.5)"
                      display="block"
                    >
                      {formatDateTime(match.scheduledDateTime)}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.8}
                      justifyContent="flex-end"
                      sx={{ mt: 0.5 }}
                    >
                      <Chip
                        label={scoreLabel}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(59,130,246,0.20)',
                          color: '#93c5fd',
                          fontWeight: 700,
                          fontSize: 10,
                          border: '1px solid rgba(59,130,246,0.35)',
                        }}
                      />
                      <Chip
                        label={outcome.label}
                        size="small"
                        sx={{
                          bgcolor: outcome.bg,
                          color: outcome.color,
                          fontWeight: 700,
                          fontSize: 10,
                          border: outcome.border,
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' },
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Composant principal ────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState<Equipe | null>(null);
  const [memberMatches, setMemberMatches] = useState<TeamMatch[]>([]);
  const [participatedTournaments, setParticipatedTournaments] = useState<
    { id: number; nom: string; etat?: string; dateDebut?: string }[]
  >([]);
  const [participationsLoading, setParticipationsLoading] = useState(true);
  const [participationsError, setParticipationsError] = useState<string | null>(
    null,
  );

  // ── États pop-up ─────────────────────────────────────────────────────────────
  const [tournoiDialogOpen, setTournoiDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://'))
      return avatar;
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  useEffect(() => {
    const loadProfileParticipation = async () => {
      setParticipationsLoading(true);
      setParticipationsError(null);

      let currentTeam: Equipe | null = null;
      try {
        currentTeam = await getUserTeam();
        setTeam(currentTeam);
        setHasTeam(!!currentTeam);
      } catch {
        setTeam(null);
        setHasTeam(false);
      }

      const resolvedUserId = (() => {
        const directId = (authenticatedUser as { id?: number } | undefined)?.id;
        if (typeof directId === 'number' && Number.isFinite(directId))
          return directId;
        const token = authenticatedUser?.token || getAuthenticatedUser()?.token;
        if (!token) return null;
        const payload = decodeJwtPayload(token);
        const candidateId =
          typeof payload?.id === 'number'
            ? payload.id
            : typeof payload?.userId === 'number'
              ? payload.userId
              : Number(payload?.sub);
        return Number.isFinite(candidateId) ? candidateId : null;
      })();

      if (resolvedUserId == null) {
        setMemberMatches([]);
        setParticipatedTournaments([]);
        setParticipationsLoading(false);
        return;
      }

      try {
        const matches = await fetchMemberMatches(resolvedUserId);
        const finishedMatches = matches
          .filter((match) => {
            const normalizedStatus = (match.status ?? '').toLowerCase();
            const hasScore =
              typeof match.scoreTeam1 === 'number' &&
              typeof match.scoreTeam2 === 'number';
            return (
              hasScore ||
              normalizedStatus === 'termine' ||
              normalizedStatus === 'finished' ||
              normalizedStatus === 'completed' ||
              normalizedStatus === 'complete'
            );
          })
          .sort((l, r) => {
            const lDate = l.scheduledDateTime
              ? new Date(l.scheduledDateTime).getTime()
              : 0;
            const rDate = r.scheduledDateTime
              ? new Date(r.scheduledDateTime).getTime()
              : 0;
            return rDate - lDate;
          });

        setMemberMatches(finishedMatches);

        const uniqueTournamentIds = [
          ...new Set(finishedMatches.map((m) => m.tournamentId)),
        ];
        const tournaments = await Promise.all(
          uniqueTournamentIds.map(async (id) => {
            try {
              return await fetchTournamentById(id);
            } catch {
              return null;
            }
          }),
        );
        setParticipatedTournaments(
          tournaments.filter(
            (
              t,
            ): t is {
              id: number;
              nom: string;
              etat?: string;
              dateDebut?: string;
            } => t !== null,
          ),
        );
      } catch {
        setMemberMatches([]);
        setParticipatedTournaments([]);
        setParticipationsError(
          'Impossible de charger vos tournois et matchs pour le moment.',
        );
      } finally {
        setParticipationsLoading(false);
      }
    };

    loadProfileParticipation();
  }, [authenticatedUser]);

  const userTag = authenticatedUser?.tag || 'Joueur';
  const rawSpecialty = authenticatedUser?.specialty || '';
  const userRole = rawSpecialty
    ? rawSpecialty.charAt(0).toUpperCase() + rawSpecialty.slice(1)
    : 'Rôle non défini';
  const userEmail = authenticatedUser?.email || 'Email non disponible';
  const userAvatar =
    normalizeAvatarUrl(authenticatedUser?.profileImage) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userTag}`;

  const formatDate = (value?: string) => {
    if (!value) return 'Date non définie';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'Date non définie';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const sortedParticipatedTournaments = useMemo(
    () =>
      [...participatedTournaments].sort((l, r) => {
        const lDate = l.dateDebut ? new Date(l.dateDebut).getTime() : 0;
        const rDate = r.dateDebut ? new Date(r.dateDebut).getTime() : 0;
        return rDate - lDate;
      }),
    [participatedTournaments],
  );

  // Aperçu : 5 premiers seulement
  const previewTournaments = sortedParticipatedTournaments.slice(
    0,
    PREVIEW_LIMIT,
  );
  const previewMatches = memberMatches.slice(0, PREVIEW_LIMIT);

  const chipColor = (etat?: string) => {
    if (etat === 'EN_COURS') return '#e8822a';
    if (etat === 'TERMINE') return '#10b981';
    if (etat === 'ANNULE') return '#ef4444';
    return '#3b82f6';
  };

  const etatLabel = (etat?: string) => {
    const map: Record<string, string> = {
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      CLOTURE: 'Clôturé',
      OUVERT: 'Ouvert',
    };
    return etat ? (map[etat] ?? etat) : 'Inconnu';
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(30,58,95,0.45), transparent)',
          pointerEvents: 'none',
        }}
      />
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.035,
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            x="0"
            y="0"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* WELCOME BANNER */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background:
              'linear-gradient(135deg, rgba(17,43,79,0.9) 0%, rgba(26,37,64,0.9) 100%)',
            border: '1px solid rgba(44,90,142,0.35)',
            color: 'white',
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <BackButton />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bonjour {userTag} 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
            {hasTeam
              ? "Vous faites partie d'une équipe. Accédez à votre espace d'équipe pour gérer les membres et suivre votre progression !"
              : "Bienvenue sur votre espace personnel. Il semble que vous ne fassiez partie d'aucune équipe pour le moment. Pour participer aux tournois, rejoignez une escouade ou fondez la vôtre !"}
          </Typography>
        </Paper>

        {/* PROFILE CARD */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={userAvatar}
              imgProps={{
                onError: (e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userTag}`;
                },
              }}
              sx={{ width: 80, height: 80, border: '2px solid #e8822a' }}
            />
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {userTag}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userRole}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Équipe : {team?.name || "Pas d'équipe"}
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/disponibilites')}
              sx={{
                backgroundColor: '#e8822a',
                color: 'white',
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Mes indisponibilités
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/profile')}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: '#e8822a',
                  color: '#e8822a',
                  backgroundColor: 'rgba(232,130,42,0.08)',
                },
              }}
            >
              Modifier le profil
            </Button>
          </Stack>
        </Paper>

        {/* TOURNOIS & MATCHS */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* ── Tournois ── */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <EmojiEventsIcon sx={{ color: '#e8822a', fontSize: 22 }} />
                <Typography variant="h6" fontWeight={700} color="white">
                  Tournois participés
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={sortedParticipatedTournaments.length}
                  size="small"
                  sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700 }}
                />
                {sortedParticipatedTournaments.length > PREVIEW_LIMIT && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<FilterIcon />}
                    onClick={() => setTournoiDialogOpen(true)}
                    sx={{
                      color: '#e8822a',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: 'rgba(232,130,42,0.1)' },
                    }}
                  >
                    Voir tout →
                  </Button>
                )}
              </Stack>
            </Stack>

            {participationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e8822a' }} />
              </Box>
            ) : participationsError ? (
              <Alert severity="warning">{participationsError}</Alert>
            ) : previewTournaments.length === 0 ? (
              <Typography variant="body2" color="rgba(255,255,255,0.4)">
                Aucun tournoi pour le moment.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {previewTournaments.map((tournament) => {
                  const color = chipColor(tournament.etat);
                  return (
                    <Box
                      key={tournament.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/tournois/${tournament.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          navigate(`/tournois/${tournament.id}`);
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.07)',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        transition: 'border-color 0.2s, transform 0.2s',
                        '&:hover': {
                          borderColor: color,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="white"
                        >
                          {tournament.nom}
                        </Typography>
                        {tournament.dateDebut && (
                          <Typography
                            variant="caption"
                            color="rgba(255,255,255,0.45)"
                          >
                            {formatDate(tournament.dateDebut)}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={etatLabel(tournament.etat)}
                        size="small"
                        sx={{
                          bgcolor: `${color}22`,
                          color,
                          fontWeight: 700,
                          fontSize: 10,
                          border: `1px solid ${color}44`,
                        }}
                      />
                    </Box>
                  );
                })}
                {/* Indicateur s'il y en a plus */}
                {sortedParticipatedTournaments.length > PREVIEW_LIMIT && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setTournoiDialogOpen(true)}
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.75rem',
                      '&:hover': { color: '#e8822a' },
                    }}
                  >
                    + {sortedParticipatedTournaments.length - PREVIEW_LIMIT}{' '}
                    autres tournois…
                  </Button>
                )}
              </Stack>
            )}
          </Paper>

          {/* ── Matchs ── */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <SportsMartialArtsIcon
                  sx={{ color: '#3b82f6', fontSize: 22 }}
                />
                <Typography variant="h6" fontWeight={700} color="white">
                  Historique des matchs
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={memberMatches.length}
                  size="small"
                  sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 700 }}
                />
                {memberMatches.length > PREVIEW_LIMIT && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<FilterIcon />}
                    onClick={() => setMatchDialogOpen(true)}
                    sx={{
                      color: '#3b82f6',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' },
                    }}
                  >
                    Voir tout →
                  </Button>
                )}
              </Stack>
            </Stack>

            {participationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e8822a' }} />
              </Box>
            ) : previewMatches.length === 0 ? (
              <Typography variant="body2" color="rgba(255,255,255,0.4)">
                Aucun match joué pour le moment.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {previewMatches.map((match) => {
                  const isTeam1 = team?.id != null && match.team1Id === team.id;
                  const isTeam2 = team?.id != null && match.team2Id === team.id;
                  const matchTitle = isTeam1
                    ? `vs ${match.team2Name ?? '?'}`
                    : isTeam2
                      ? `vs ${match.team1Name ?? '?'}`
                      : `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;
                  const tournamentObj = participatedTournaments.find(
                    (t) => t.id === match.tournamentId,
                  );
                  const tournamentName =
                    tournamentObj?.nom ?? `Tournoi #${match.tournamentId}`;
                  const hasScore =
                    typeof match.scoreTeam1 === 'number' &&
                    typeof match.scoreTeam2 === 'number';
                  const score1 = Number(match.scoreTeam1);
                  const score2 = Number(match.scoreTeam2);
                  const scoreLabel = hasScore
                    ? isTeam1
                      ? `${score1} - ${score2}`
                      : isTeam2
                        ? `${score2} - ${score1}`
                        : `${score1} - ${score2}`
                    : 'Score indisponible';

                  let outcomeLabel = 'Résultat indisponible';
                  let outcomeColor = '#94a3b8';
                  let outcomeBackground = 'rgba(148,163,184,0.20)';
                  let outcomeBorder = '1px solid rgba(148,163,184,0.35)';

                  if (hasScore && (isTeam1 || isTeam2)) {
                    const myScore = isTeam1 ? score1 : score2;
                    const oppScore = isTeam1 ? score2 : score1;
                    if (myScore > oppScore) {
                      outcomeLabel = 'Victoire';
                      outcomeColor = '#34d399';
                      outcomeBackground = 'rgba(16,185,129,0.20)';
                      outcomeBorder = '1px solid rgba(16,185,129,0.35)';
                    } else if (myScore < oppScore) {
                      outcomeLabel = 'Défaite';
                      outcomeColor = '#f87171';
                      outcomeBackground = 'rgba(239,68,68,0.20)';
                      outcomeBorder = '1px solid rgba(239,68,68,0.35)';
                    } else {
                      outcomeLabel = 'Nul';
                      outcomeColor = '#93c5fd';
                      outcomeBackground = 'rgba(59,130,246,0.20)';
                      outcomeBorder = '1px solid rgba(59,130,246,0.35)';
                    }
                  }

                  return (
                    <Box
                      key={match.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/tournois/${match.tournamentId}/matchs/${match.id}`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(
                            `/tournois/${match.tournamentId}/matchs/${match.id}`,
                          );
                        }
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.07)',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        transition:
                          'border-color 0.2s ease, transform 0.2s ease',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="white"
                        >
                          {matchTitle}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="rgba(255,255,255,0.45)"
                        >
                          {tournamentName}
                          {match.round != null ? ` · Tour ${match.round}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color="rgba(255,255,255,0.75)"
                        >
                          {formatDateTime(match.scheduledDateTime)}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.8}
                          justifyContent="flex-end"
                          alignItems="center"
                          sx={{ mt: 0.7 }}
                        >
                          <Chip
                            label={scoreLabel}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(59,130,246,0.20)',
                              color: '#93c5fd',
                              fontWeight: 700,
                              fontSize: 10,
                              border: '1px solid rgba(59,130,246,0.35)',
                            }}
                          />
                          <Chip
                            label={outcomeLabel}
                            size="small"
                            sx={{
                              bgcolor: outcomeBackground,
                              color: outcomeColor,
                              fontWeight: 700,
                              fontSize: 10,
                              border: outcomeBorder,
                            }}
                          />
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
                {memberMatches.length > PREVIEW_LIMIT && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setMatchDialogOpen(true)}
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.75rem',
                      '&:hover': { color: '#3b82f6' },
                    }}
                  >
                    + {memberMatches.length - PREVIEW_LIMIT} autres matchs…
                  </Button>
                )}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* ACTION GRID (Create / Join) */}
        {!hasTeam && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CreateIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Créer une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous avez l&apos;âme d&apos;un leader ? Fondez votre propre
                  équipe, recrutez des joueurs et devenez responsable.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/equipes/creer')}
                  sx={{
                    backgroundColor: '#e8822a',
                    '&:hover': { backgroundColor: '#c86e20' },
                  }}
                >
                  Créer mon équipe
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'rgba(232,130,42,0.15)',
                    border: '2px solid #e8822a',
                    color: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <JoinIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Rejoindre une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous cherchez des frères d&apos;armes ? Parcourez
                  l&apos;annuaire des équipes et envoyez votre candidature.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/equipes')}
                  sx={{
                    color: '#e8822a',
                    borderColor: '#e8822a',
                    '&:hover': {
                      borderColor: '#c86e20',
                      backgroundColor: 'rgba(232,130,42,0.08)',
                    },
                  }}
                >
                  Chercher une équipe
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* ── Pop-ups ───────────────────────────────────────────── */}
      <TournoiDialog
        open={tournoiDialogOpen}
        onClose={() => setTournoiDialogOpen(false)}
        tournaments={sortedParticipatedTournaments}
        onNavigate={(id) => navigate(`/tournois/${id}`)}
        formatDate={formatDate}
      />
      <MatchDialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        matches={memberMatches}
        team={team}
        participatedTournaments={participatedTournaments}
        onNavigate={(tournamentId, matchId) =>
          navigate(`/tournois/${tournamentId}/matchs/${matchId}`)
        }
        formatDateTime={formatDateTime}
      />
    </Box>
  );
};

export default Profile;
