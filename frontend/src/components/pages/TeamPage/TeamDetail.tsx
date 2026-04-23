import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  SportsEsports as MatchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { getEquipeById } from '../../../services/teams';
import {
  fetchAcceptedTournamentRegistrations,
  fetchPublicTournaments,
  fetchTeamMatchTimeline,
  TeamMatch,
} from '../../../services/tournaments';
import { Equipe, Tournoi } from '../../../types';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';

interface MemberCardProps {
  member: Equipe['members'][number];
  isResponsable: boolean;
  isCurrentUser: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isResponsable,
  isCurrentUser,
}) => {
  const navigate = useNavigate();

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return avatar;
    }
    return `/${avatar}`;
  };

  return (
    <Paper
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
        '&:hover': {
          borderColor: isResponsable ? '#e8822a' : 'rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(26, 37, 64, 0.8)',
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        },
      }}
    >
      <Avatar
        src={normalizeAvatarUrl(member.profileImageUrl || member.profileImage)}
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
        sx={{
          mb: 0.5,
        }}
      >
        {member.tag}
      </Typography>

      {isCurrentUser && (
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
        label={isResponsable ? 'Responsable' : 'Membre'}
        size="small"
        sx={{
          fontSize: 10,
          fontWeight: 700,
          bgcolor: isResponsable ? '#e8822a' : '#334155',
          color: 'white',
          mt: 1.5,
          mb: 2,
        }}
      />

      <Tooltip title="Voir le profil" placement="top">
        <IconButton
          size="small"
          onClick={() => navigate(`/players/${member.id}`)}
          sx={{
            mt: 0.5,
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 1.5,
            '&:hover': {
              color: '#e8822a',
              borderColor: '#e8822a',
              bgcolor: 'rgba(232,130,42,0.08)',
            },
          }}
        >
          <VisibilityIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

type TournamentFilterState =
  | 'ALL'
  | 'EN_COURS'
  | 'OUVERT'
  | 'CLOTURE'
  | 'TERMINE';

type MatchFilterState = 'ALL' | 'A_JOUER' | 'EN_COURS' | 'TERMINE';

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

const darkSelectSx = {
  color: 'white',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.18)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.32)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e8822a',
  },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
};

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

type TournamentSectionProps = {
  title: string;
  tournaments: Tournoi[];
  emptyMessage: string;
  accentColor: string;
  onNavigate: (id: number) => void;
};

const TournamentSection = ({
  title,
  tournaments,
  emptyMessage,
  accentColor,
  onNavigate,
}: TournamentSectionProps) => {
  const [open, setOpen] = useState(false);
  const preview = tournaments.slice(0, 3);
  const hasMore = tournaments.length > 3;

  const renderList = (items: Tournoi[]) => (
    <List disablePadding>
      {items.map((tournament, index) => {
        const tournamentState = normalizeState(tournament.etat);
        return (
          <Box key={tournament.id}>
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
              onClick={() => onNavigate(tournament.id)}
            >
              <Box>
                <Typography fontWeight={700} color="white">
                  {tournament.nom || 'Tournoi sans nom'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.75)">
                  Début : {formatDate(tournament.dateDebut)}
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
              label={tournaments.length}
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

        {tournaments.length === 0 ? (
          <Typography variant="body2" color="rgba(255,255,255,0.75)">
            {emptyMessage}
          </Typography>
        ) : (
          renderList(preview)
        )}
      </Paper>

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
            label={tournaments.length}
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
          {renderList(tournaments)}
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
    fetchTeamMatchTimeline(teamId)
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const aTs = a.scheduledDateTime ? Date.parse(a.scheduledDateTime) : 0;
          const bTs = b.scheduledDateTime ? Date.parse(b.scheduledDateTime) : 0;
          return bTs - aTs;
        });
        setMatches(sorted);
      })
      .catch(() => {
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const getMatchStatus = (
    match: TeamMatch,
  ): Exclude<MatchFilterState, 'ALL'> => {
    const normalizedStatus = (match.status ?? '').toLowerCase();
    const hasScore =
      typeof match.scoreTeam1 === 'number' &&
      typeof match.scoreTeam2 === 'number';

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

    if (match.scheduledDateTime) {
      const scheduledTime = Date.parse(match.scheduledDateTime);
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

  const filteredMatches = useMemo(
    () =>
      matches.filter((match) => {
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
      }),
    [matches, matchFilter, matchSearch],
  );

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

export default function TeamDetails() {
  const pageBlueGradient =
    'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUserId = (() => {
    const token = getAuthenticatedUser()?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  const [team, setTeam] = useState<Equipe | null>(null);
  const [teamTournaments, setTeamTournaments] = useState<Tournoi[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [tournamentFilter, setTournamentFilter] =
    useState<TournamentFilterState>('ALL');
  const [tournamentSearch, setTournamentSearch] = useState('');

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return avatar;
    }
    return `/${avatar}`;
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadTeam = async () => {
      try {
        const data = await getEquipeById(id);
        setTeam(data);

        setLoadingHistory(true);
        setHistoryError(null);

        try {
          const publicTournaments =
            (await fetchPublicTournaments()) as Tournoi[];
          const teamMatches = await fetchTeamMatchTimeline(data.id);
          const registeredTournamentIds = new Set(
            teamMatches.map((match) => match.tournamentId),
          );
          const checks = await Promise.all(
            publicTournaments.map(async (tournoi) => {
              if (registeredTournamentIds.has(tournoi.id)) {
                return tournoi;
              }

              const acceptedRegistrations =
                await fetchAcceptedTournamentRegistrations(tournoi.id);
              const isTeamRegistered = acceptedRegistrations.some(
                (registration) => registration.equipeId === data.id,
              );
              return isTeamRegistered ? tournoi : null;
            }),
          );

          setTeamTournaments(
            checks.filter((value): value is Tournoi => Boolean(value)),
          );
        } catch (historyErr: unknown) {
          console.error('Erreur historique tournois :', historyErr);
          setTeamTournaments([]);
          setHistoryError(
            "Impossible de charger l'historique des tournois pour le moment.",
          );
        } finally {
          setLoadingHistory(false);
        }
      } catch (err: unknown) {
        console.error('Erreur API :', err);
        setLoadingHistory(false);
      }
    };

    loadTeam();
  }, [id]);

  const teamMembers = team?.members ?? [];

  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aResponsable = a.isResponsable ? 1 : 0;
    const bResponsable = b.isResponsable ? 1 : 0;
    if (aResponsable !== bResponsable) {
      return bResponsable - aResponsable;
    }

    const aTag = (a.tag || '').trim();
    const bTag = (b.tag || '').trim();
    const byTag = aTag.localeCompare(bTag, 'fr', {
      sensitivity: 'base',
    });
    if (byTag !== 0) {
      return byTag;
    }

    return (a.id || 0) - (b.id || 0);
  });

  const tournamentsSorted = useMemo(
    () =>
      [...teamTournaments].sort(
        (a, b) =>
          parseTournamentDate(a.dateDebut) - parseTournamentDate(b.dateDebut),
      ),
    [teamTournaments],
  );

  const filteredTournaments = useMemo(() => {
    return tournamentsSorted.filter((tournament) => {
      const etat = normalizeState(tournament.etat);
      if (tournamentFilter !== 'ALL' && etat !== tournamentFilter) return false;

      if (tournamentSearch.trim()) {
        const searchTerm = tournamentSearch.trim().toLowerCase();
        if (!(tournament.nom || '').toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [tournamentsSorted, tournamentFilter, tournamentSearch]);

  const inProgressTournaments = useMemo(
    () =>
      filteredTournaments.filter(
        (tournament) => tournament.etat === 'EN_COURS',
      ),
    [filteredTournaments],
  );

  const upcomingTournaments = useMemo(
    () =>
      filteredTournaments.filter(
        (tournament) =>
          tournament.etat === 'OUVERT' ||
          tournament.etat === 'CLOTURE' ||
          tournament.etat === 'BROUILLON',
      ),
    [filteredTournaments],
  );

  const pastTournaments = useMemo(
    () =>
      filteredTournaments
        .filter((tournament) => tournament.etat === 'TERMINE')
        .sort(
          (a, b) =>
            parseTournamentDate(b.dateDebut) - parseTournamentDate(a.dateDebut),
        ),
    [filteredTournaments],
  );

  if (!team) {
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
        <Typography color="white">Chargement...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        background: pageBlueGradient,
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        {/* Replaced Paper with Card here so it matches CardContent correctly */}
        <Card
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
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 📸 TEAM IMAGE */}
            {team.profileImage && (
              <Avatar
                src={normalizeAvatarUrl(team.profileImage)}
                alt={team.name}
                variant="rounded"
                sx={{
                  width: 80,
                  height: 80,
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
            )}

            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mb: 1 }}
                color="white"
              >
                {team.name}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Membres : {team.members.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box>
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
              {team.members.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Cette équipe n'a plus de membre.
                </Typography>
              )}

              {sortedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isResponsable={member.isResponsable ?? false}
                  isCurrentUser={member.id === currentUserId}
                />
              ))}
            </Box>
          </Box>

          <Stack spacing={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: '#1a2540',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
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
                  label={teamTournaments.length}
                  size="small"
                  sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700 }}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <TextField
                  size="small"
                  placeholder="Rechercher un tournoi..."
                  value={tournamentSearch}
                  onChange={(event) => setTournamentSearch(event.target.value)}
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
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    État
                  </InputLabel>
                  <Select
                    value={tournamentFilter}
                    label="État"
                    onChange={(
                      event: SelectChangeEvent<TournamentFilterState>,
                    ) =>
                      setTournamentFilter(
                        event.target.value as TournamentFilterState,
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

              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress color="secondary" size={24} />
                </Box>
              ) : historyError ? (
                <Alert severity="warning">{historyError}</Alert>
              ) : (
                <>
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'EN_COURS') && (
                    <TournamentSection
                      title="En cours"
                      tournaments={inProgressTournaments}
                      emptyMessage="Aucun tournoi en cours."
                      accentColor="#f59e0b"
                      onNavigate={(teamTournamentId) =>
                        navigate(`/tournois/${teamTournamentId}`)
                      }
                    />
                  )}
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'OUVERT' ||
                    tournamentFilter === 'CLOTURE') && (
                    <TournamentSection
                      title="À venir"
                      tournaments={upcomingTournaments}
                      emptyMessage="Aucun tournoi à venir."
                      accentColor="#3b82f6"
                      onNavigate={(teamTournamentId) =>
                        navigate(`/tournois/${teamTournamentId}`)
                      }
                    />
                  )}
                  {(tournamentFilter === 'ALL' ||
                    tournamentFilter === 'TERMINE') && (
                    <TournamentSection
                      title="Passés"
                      tournaments={pastTournaments}
                      emptyMessage="Aucun tournoi passé."
                      accentColor="#10b981"
                      onNavigate={(teamTournamentId) =>
                        navigate(`/tournois/${teamTournamentId}`)
                      }
                    />
                  )}
                </>
              )}
            </Paper>

            <MatchHistorySection teamId={team.id} />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
