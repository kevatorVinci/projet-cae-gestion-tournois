import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { User, UserContextType } from '../../../types';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';
import { getRoundLabelFromMax } from '../../../utils/bracketLabels';
import { getAllEquipes } from '../../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
  TeamMatch,
} from '../../../services/tournaments';
import BackButton from '../../BackButton';
import { UserContext } from '../../../contexts/UserContext';

// ── Types ──────────────────────────────────────────────────────────────────────
type TournamentEtat = 'ALL' | 'EN_COURS' | 'TERMINE' | 'OUVERT' | 'CLOTURE' | 'ANNULE';
type MatchOutcome = 'ALL' | 'VICTOIRE' | 'DEFAITE' | 'NUL';

interface Player {
  tag: string;
  id: number;
  email?: string;
  specialty?: string;
  profileImage?: string;
  profileImageUrl?: string;
  isResponsable?: boolean;
}

interface UserLookupItem {
  id?: number;
  tag?: string;
  email?: string;
  specialty?: string;
  profileImage?: string;
  profileImageUrl?: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────────
const PREVIEW_LIMIT = 5;
const pageGradient = 'linear-gradient(135deg, #0f172a 0%, #1a2540 50%, #0f172a 100%)';

// ── Styles partagés ────────────────────────────────────────────────────────────
const darkSelectSx = {
  color: 'white',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.32)' },
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
  '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const capitalize = (value?: string): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatMatchDateTime = (value?: string): string => {
  if (!value) return 'Date non définie';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
};

const getTournamentChipColor = (etat?: string) => {
  if (etat === 'EN_COURS') return '#e8822a';
  if (etat === 'TERMINE') return '#10b981';
  if (etat === 'ANNULE') return '#ef4444';
  return '#3b82f6';
};

const getTournamentEtatLabel = (etat?: string) => {
  const map: Record<string, string> = {
    EN_COURS: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé',
    CLOTURE: 'Clôturé', OUVERT: 'Ouvert',
  };
  return etat ? (map[etat] ?? etat) : 'Inconnu';
};

const findUserByParam = (list: UserLookupItem[], value: string): UserLookupItem | null => {
  const loweredValue = value.toLowerCase();
  return list.find((item) => item.tag?.toLowerCase() === loweredValue || String(item.id) === value) || null;
};

const resolveMemberId = (
  decodedId: string,
  candidate: { id?: number; tag?: string } | null | undefined,
  token: string,
): number | null => {
  if (typeof candidate?.id === 'number' && Number.isFinite(candidate.id)) return candidate.id;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const candidateId =
    typeof payload?.id === 'number' ? payload.id
    : typeof payload?.userId === 'number' ? payload.userId
    : Number(payload?.sub);
  if (!Number.isFinite(candidateId)) return null;
  if (candidate?.tag) {
    const normalizedCandidateTag = candidate.tag.toLowerCase();
    const normalizedRouteId = decodedId.toLowerCase();
    if (normalizedCandidateTag === normalizedRouteId || String(candidateId) === decodedId) return candidateId;
  }
  return null;
};

// ── Pop-up Tournois ────────────────────────────────────────────────────────────
type TournoiDialogProps = {
  open: boolean;
  onClose: () => void;
  tournaments: { id: number; nom: string; etat?: string; dateDebut?: string }[];
  onNavigate: (id: number) => void;
};

const TournoiDialog = ({ open, onClose, tournaments, onNavigate }: TournoiDialogProps) => {
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState<TournamentEtat>('ALL');

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (etatFilter !== 'ALL' && t.etat !== etatFilter) return false;
      if (search.trim() && !t.nom.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [tournaments, search, etatFilter]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#0f1729', color: 'white', border: '1px solid rgba(232,130,42,0.3)', borderRadius: 3 } }}
    >
      <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmojiEventsIcon sx={{ color: '#e8822a' }} />
          <span>Tous les tournois</span>
          <Chip label={filtered.length} size="small"
            sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700, ml: 1 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField size="small" fullWidth placeholder="Rechercher un tournoi..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={darkTextFieldSx}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>État</InputLabel>
            <Select value={etatFilter} label="État"
              onChange={(e: SelectChangeEvent<TournamentEtat>) => setEtatFilter(e.target.value as TournamentEtat)}
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

        {filtered.length === 0 ? (
          <Typography variant="body2" color="rgba(255,255,255,0.4)" sx={{ textAlign: 'center', py: 3 }}>
            Aucun tournoi trouvé.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((t) => {
              const color = getTournamentChipColor(t.etat);
              return (
                <Box key={t.id} role="button" tabIndex={0}
                  onClick={() => { onNavigate(t.id); onClose(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onNavigate(t.id); onClose(); } }}
                  sx={{
                    p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': { borderColor: color, transform: 'translateY(-1px)' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="white">{t.nom}</Typography>
                    {t.dateDebut && (
                      <Typography variant="caption" color="rgba(255,255,255,0.45)">
                        {new Date(t.dateDebut).toLocaleDateString('fr-BE')}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={getTournamentEtatLabel(t.etat)} size="small"
                    sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: 10, border: `1px solid ${color}44` }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined"
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#e8822a', color: '#e8822a' } }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Pop-up Matchs ──────────────────────────────────────────────────────────────
type MatchDialogProps = {
  open: boolean;
  onClose: () => void;
  matches: TeamMatch[];
  teamId: number | null;
  participatedTournaments: { id: number; nom: string; etat?: string; dateDebut?: string }[];
  maxRound: number;
  onNavigate: (tournamentId: number, matchId: number) => void;
};

const MatchDialog = ({
  open, onClose, matches, teamId, participatedTournaments, maxRound, onNavigate,
}: MatchDialogProps) => {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<MatchOutcome>('ALL');

  const getOutcomeInfo = (match: TeamMatch) => {
    const isTeam1 = teamId != null && match.team1Id === teamId;
    const isTeam2 = teamId != null && match.team2Id === teamId;
    const hasScore = typeof match.scoreTeam1 === 'number' && typeof match.scoreTeam2 === 'number';

    if (!hasScore) return { label: 'Score indisponible', outcomeLabel: 'Terminé', color: '#94a3b8', bg: 'rgba(148,163,184,0.20)', border: '1px solid rgba(148,163,184,0.35)' };

    const score1 = Number(match.scoreTeam1);
    const score2 = Number(match.scoreTeam2);
    const scoreLabel = `${score1} - ${score2}`;

    if (isTeam1 || isTeam2) {
      const myScore = isTeam1 ? score1 : score2;
      const oppScore = isTeam1 ? score2 : score1;
      if (myScore > oppScore) return { label: scoreLabel, outcomeLabel: 'Victoire', color: '#34d399', bg: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.35)' };
      if (myScore < oppScore) return { label: scoreLabel, outcomeLabel: 'Défaite', color: '#f87171', bg: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)' };
      return { label: scoreLabel, outcomeLabel: 'Nul', color: '#93c5fd', bg: 'rgba(59,130,246,0.20)', border: '1px solid rgba(59,130,246,0.35)' };
    }

    if (score1 > score2) return { label: scoreLabel, outcomeLabel: `Victoire de ${match.team1Name ?? 'Éq 1'}`, color: '#34d399', bg: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.35)' };
    if (score1 < score2) return { label: scoreLabel, outcomeLabel: `Victoire de ${match.team2Name ?? 'Éq 2'}`, color: '#34d399', bg: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.35)' };
    return { label: scoreLabel, outcomeLabel: 'Match nul', color: '#93c5fd', bg: 'rgba(59,130,246,0.20)', border: '1px solid rgba(59,130,246,0.35)' };
  };

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (outcomeFilter !== 'ALL') {
        const { outcomeLabel } = getOutcomeInfo(m);
        const map: Record<MatchOutcome, string> = { ALL: '', VICTOIRE: 'Victoire', DEFAITE: 'Défaite', NUL: 'Nul' };
        if (outcomeLabel !== map[outcomeFilter]) return false;
      }
      if (search.trim()) {
        const t1 = (m.team1Name ?? '').toLowerCase();
        const t2 = (m.team2Name ?? '').toLowerCase();
        const tName = (participatedTournaments.find((t) => t.id === m.tournamentId)?.nom ?? '').toLowerCase();
        const s = search.toLowerCase();
        if (!t1.includes(s) && !t2.includes(s) && !tName.includes(s)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, search, outcomeFilter, teamId, participatedTournaments]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#0f1729', color: 'white', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 3 } }}
    >
      <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SportsMartialArtsIcon sx={{ color: '#3b82f6' }} />
          <span>Tous les matchs</span>
          <Chip label={filtered.length} size="small"
            sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 700, ml: 1 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField size="small" fullWidth placeholder="Équipe ou tournoi..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={darkTextFieldSx}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Résultat</InputLabel>
            <Select value={outcomeFilter} label="Résultat"
              onChange={(e: SelectChangeEvent<MatchOutcome>) => setOutcomeFilter(e.target.value as MatchOutcome)}
              sx={darkSelectSx}
            >
              <MenuItem value="ALL">Tous</MenuItem>
              <MenuItem value="VICTOIRE">Victoire</MenuItem>
              <MenuItem value="DEFAITE">Défaite</MenuItem>
              <MenuItem value="NUL">Nul</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {filtered.length === 0 ? (
          <Typography variant="body2" color="rgba(255,255,255,0.4)" sx={{ textAlign: 'center', py: 3 }}>
            Aucun match trouvé.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((match) => {
              const isTeam1 = teamId != null && match.team1Id === teamId;
              const isTeam2 = teamId != null && match.team2Id === teamId;
              const matchTitle = `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;
              const tournamentName = participatedTournaments.find((t) => t.id === match.tournamentId)?.nom ?? `Tournoi #${match.tournamentId}`;
              const { label: scoreLabel, outcomeLabel, color: outcomeColor, bg: outcomeBackground, border: outcomeBorder } = getOutcomeInfo(match);

              return (
                <Box key={match.id} role="button" tabIndex={0}
                  onClick={() => { onNavigate(match.tournamentId, match.id); onClose(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(match.tournamentId, match.id); onClose(); } }}
                  sx={{
                    p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-1px)' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="white">{matchTitle}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.45)">
                      {tournamentName}
                      {match.round != null ? ` · ${getRoundLabelFromMax(match.round, maxRound)}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)" display="block">
                      {formatMatchDateTime(match.scheduledDateTime)}
                    </Typography>
                    <Stack direction="row" spacing={0.8} justifyContent="flex-end" sx={{ mt: 0.5 }}>
                      <Chip label={scoreLabel} size="small"
                        sx={{ bgcolor: 'rgba(59,130,246,0.20)', color: '#93c5fd', fontWeight: 700, fontSize: 10, border: '1px solid rgba(59,130,246,0.35)' }}
                      />
                      <Chip label={outcomeLabel} size="small"
                        sx={{ bgcolor: outcomeBackground, color: outcomeColor, fontWeight: 700, fontSize: 10, border: outcomeBorder }}
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
        <Button onClick={onClose} variant="outlined"
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' } }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Composant principal ────────────────────────────────────────────────────────
export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticatedUser } = useContext(UserContext) as UserContextType;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [participatedTournaments, setParticipatedTournaments] = useState<
    { id: number; nom: string; etat?: string; dateDebut?: string }[]
  >([]);

  // ── États pop-up ─────────────────────────────────────────────────────────────
  const [tournoiDialogOpen, setTournoiDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;
  const maxRound = matches.reduce((highest, m) => Math.max(highest, m.round ?? 1), 1);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  // Aperçus
  const previewTournaments = participatedTournaments.slice(0, PREVIEW_LIMIT);
  const previewMatches = matches.slice(0, PREVIEW_LIMIT);

  useEffect(() => {
    const fetchUserAndParticipations = async () => {
      if (!id || id === 'undefined') { setLoading(false); return; }

      const decodedId = decodeURIComponent(id);
      const isNumericParam = !Number.isNaN(Number(decodedId));
      setLoading(true);

      try {
        const token = authenticatedUser?.token || getAuthenticatedUser()?.token || '';
        let foundUser: UserLookupItem | null = null;

        const authenticatedUserWithId = authenticatedUser as (typeof authenticatedUser & { id?: number }) | undefined;
        if (authenticatedUserWithId && (authenticatedUserWithId.tag?.toLowerCase() === decodedId.toLowerCase() || String(authenticatedUserWithId.id) === decodedId)) {
          foundUser = authenticatedUserWithId;
        }

        if (!foundUser) {
          try {
            const usersResponse = await fetch('/api/auths/users', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
            if (usersResponse.ok) {
              const usersList = (await usersResponse.json()) as UserLookupItem[];
              foundUser = findUserByParam(usersList, decodedId);
            }
          } catch { /* Ignore */ }
        }

        if (!foundUser) {
          try {
            const playersResponse = await fetch('/api/auths/players', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
            if (playersResponse.ok) {
              const playersList = (await playersResponse.json()) as UserLookupItem[];
              foundUser = findUserByParam(playersList, decodedId);
            }
          } catch { /* Ignore */ }
        }

        if (!foundUser && isNumericParam) foundUser = { id: Number(decodedId), tag: `Joueur #${decodedId}` };

        const equipes = await getAllEquipes().catch(() => []);
        let foundUserInTeam: Player | null = null;
        let userTeamName = '';
        let foundTeamId: number | null = null;

        for (const equipe of equipes) {
          const listJoueurs = (equipe.members || []) as Player[];
          const member = listJoueurs.find((m) => m.tag?.toLowerCase() === decodedId.toLowerCase() || String(m.id) === decodedId);
          if (member) { foundUserInTeam = member; userTeamName = equipe.name; foundTeamId = equipe.id; break; }
        }

        if (foundUser || foundUserInTeam) {
          const freshToken = authenticatedUser?.token || getAuthenticatedUser()?.token || '';
          const foundUserCandidate = foundUser ?? undefined;
          const finalId = resolveMemberId(decodedId, foundUserCandidate, freshToken) || foundUserInTeam?.id || 0;
          const finalTag = foundUser?.tag || foundUserInTeam?.tag || 'Joueur Inconnu';
          const finalSpecialty = foundUser?.specialty || foundUserInTeam?.specialty || 'Non spécifiée';

          setUser({
            id: finalId, tag: finalTag, email: foundUser?.email || '',
            specialty: finalSpecialty, team: userTeamName || 'Aucune équipe',
            profileImage: foundUser?.profileImage || foundUser?.profileImageUrl || foundUserInTeam?.profileImageUrl || '/luffy.png',
            isResponsable: foundUserInTeam?.isResponsable || false,
          });
          setTeamId(foundTeamId);

          if (finalId > 0) {
            const allMatches = await fetchMemberMatches(finalId).catch(() => []);
            const finishedMatches = allMatches
              .filter((match) => {
                const normalizedStatus = (match.status ?? '').toLowerCase();
                const hasScore = typeof match.scoreTeam1 === 'number' && typeof match.scoreTeam2 === 'number';
                return hasScore || normalizedStatus === 'termine' || normalizedStatus === 'finished' || normalizedStatus === 'completed' || normalizedStatus === 'complete';
              })
              .sort((l, r) => {
                const lDate = l.scheduledDateTime ? new Date(l.scheduledDateTime).getTime() : 0;
                const rDate = r.scheduledDateTime ? new Date(r.scheduledDateTime).getTime() : 0;
                return rDate - lDate;
              });

            setMatches(finishedMatches);

            const uniqueTournamentIds = [...new Set(finishedMatches.map((m) => m.tournamentId))];
            const tournaments = await Promise.all(
              uniqueTournamentIds.map(async (tid) => { try { return await fetchTournamentById(tid); } catch { return null; } }),
            );
            setParticipatedTournaments(
              tournaments.filter((t): t is { id: number; nom: string; etat?: string; dateDebut?: string } => t !== null),
            );
          }
        } else {
          setUser(null); setTeamId(null); setParticipatedTournaments([]); setMatches([]);
        }
      } catch (error) {
        console.error('Erreur globale lors de la récupération:', error);
        setUser(null); setTeamId(null); setParticipatedTournaments([]); setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndParticipations();
  }, [id, authenticatedUser]);

  if (loading) {
    return (
      <Box sx={{ minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, display: 'flex', justifyContent: 'center', alignItems: 'center', background: pageGradient }}>
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, display: 'flex', justifyContent: 'center', alignItems: 'center', background: pageGradient, px: 2 }}>
        <Paper sx={{ p: 4, bgcolor: '#1a2540', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
          <Typography variant="h6" color="white">Joueur introuvable</Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ mt: 1 }}>
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, background: pageGradient, pt: { xs: 2, sm: 3 }, pb: 6 }}>
      <Container maxWidth="lg">
        <BackButton onClick={() => navigate(-1)} />

        <Stack spacing={4} sx={{ mt: 2 }}>
          {/* HEADER JOUEUR */}
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#111827', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(232,130,42,0.10), transparent 30%)', pointerEvents: 'none' }} />
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'center', md: 'center' }} spacing={3} sx={{ position: 'relative' }}>
              <Avatar src={normalizeAvatarUrl(user.profileImage)} alt={user.tag}
                sx={{ width: { xs: 110, md: 140 }, height: { xs: 110, md: 140 }, border: '3px solid #e8822a', boxShadow: '0 0 30px rgba(232,130,42,0.25)' }}
              />
              <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  {isOwnProfile ? 'Mes détails publics' : 'Profil joueur'}
                </Typography>
                <Typography variant="h3" fontWeight={800} color="#e8822a" sx={{ mb: 1, lineHeight: 1.05 }}>{user.tag}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                  <Chip label={user.isResponsable ? 'Responsable' : 'Membre'}
                    sx={{ bgcolor: user.isResponsable ? 'rgba(232,130,42,0.14)' : 'rgba(255,255,255,0.08)', color: user.isResponsable ? '#e8822a' : 'white', fontWeight: 700 }}
                  />
                  {isOwnProfile && <Chip label="Moi" sx={{ bgcolor: 'rgba(16,185,129,0.14)', color: '#34d399', fontWeight: 700 }} />}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* INFOS & ÉQUIPE */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="h6" fontWeight={700} color="white" sx={{ mb: 2.5 }}>Informations personnelles</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">Tag</Typography>
                <Typography variant="body1" fontWeight={600} color="white">{user.tag || '—'}</Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />

              {isOwnProfile && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Email</Typography>
                    <Typography variant="body1" fontWeight={600} color="white" sx={{ textAlign: 'right' }}>{user.email || '—'}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
                </>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">Spécialité</Typography>
                <Typography variant="body1" fontWeight={600} color="white" sx={{ textAlign: 'right' }}>{capitalize(user.specialty) || 'Non spécifiée'}</Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">Rôle</Typography>
                <Typography variant="body1" fontWeight={600} color={user.isResponsable ? '#e8822a' : 'white'} sx={{ textAlign: 'right' }}>
                  {user.isResponsable ? 'Responsable' : 'Membre'}
                </Typography>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="h6" fontWeight={700} color="white" sx={{ mb: 2.5 }}>Équipe actuelle</Typography>
              <Box role={teamId ? 'button' : undefined} tabIndex={teamId ? 0 : undefined}
                onClick={() => { if (teamId) navigate(`/equipes/${teamId}`); }}
                onKeyDown={(e) => { if (teamId && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/equipes/${teamId}`); } }}
                sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', cursor: teamId ? 'pointer' : 'default', transition: 'border-color 0.2s ease, transform 0.2s ease', '&:hover': teamId ? { borderColor: '#e8822a', transform: 'translateY(-2px)' } : undefined }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupsIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">Équipe actuelle</Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={700}>{user.team || 'Aucune équipe'}</Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ mt: 1 }}>
                  {teamId ? "Cliquez pour consulter la page de l'équipe." : "Ce joueur ne fait actuellement partie d'aucune équipe."}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* ── TOURNOIS & MATCHS ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>

            {/* Tournois */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEventsIcon sx={{ color: '#e8822a', fontSize: 22 }} />
                  <Typography variant="h6" fontWeight={700} color="white">Tournois participés</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={participatedTournaments.length} size="small"
                    sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 700 }}
                  />
                  {participatedTournaments.length > PREVIEW_LIMIT && (
                    <Button size="small" variant="text" startIcon={<FilterListIcon />}
                      onClick={() => setTournoiDialogOpen(true)}
                      sx={{ color: '#e8822a', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(232,130,42,0.1)' } }}
                    >
                      Voir tout →
                    </Button>
                  )}
                </Stack>
              </Stack>

              {previewTournaments.length === 0 ? (
                <Typography variant="body2" color="rgba(255,255,255,0.4)">Aucun tournoi pour le moment.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {previewTournaments.map((tournament) => {
                    const color = getTournamentChipColor(tournament.etat);
                    return (
                      <Box key={tournament.id} role="button" tabIndex={0}
                        onClick={() => navigate(`/tournois/${tournament.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/tournois/${tournament.id}`); }}
                        sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', bgcolor: 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, transition: 'border-color 0.2s', '&:hover': { borderColor: color, transform: 'translateY(-2px)' } }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="white">{tournament.nom}</Typography>
                          {tournament.dateDebut && (
                            <Typography variant="caption" color="rgba(255,255,255,0.45)">
                              {new Date(tournament.dateDebut).toLocaleDateString('fr-BE')}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={getTournamentEtatLabel(tournament.etat)} size="small"
                          sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: 10, border: `1px solid ${color}44` }}
                        />
                      </Box>
                    );
                  })}
                  {participatedTournaments.length > PREVIEW_LIMIT && (
                    <Button variant="text" size="small" onClick={() => setTournoiDialogOpen(true)}
                      sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', '&:hover': { color: '#e8822a' } }}
                    >
                      + {participatedTournaments.length - PREVIEW_LIMIT} autres tournois…
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>

            {/* Matchs */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SportsMartialArtsIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
                  <Typography variant="h6" fontWeight={700} color="white">Historique des matchs</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={matches.length} size="small"
                    sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 700 }}
                  />
                  {matches.length > PREVIEW_LIMIT && (
                    <Button size="small" variant="text" startIcon={<FilterListIcon />}
                      onClick={() => setMatchDialogOpen(true)}
                      sx={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' } }}
                    >
                      Voir tout →
                    </Button>
                  )}
                </Stack>
              </Stack>

              {previewMatches.length === 0 ? (
                <Typography variant="body2" color="rgba(255,255,255,0.4)">Aucun match joué pour le moment.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {previewMatches.map((match) => {
                    const isTeam1 = teamId != null && match.team1Id === teamId;
                    const isTeam2 = teamId != null && match.team2Id === teamId;
                    const matchTitle = `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;
                    const tournamentName = participatedTournaments.find((t) => t.id === match.tournamentId)?.nom ?? `Tournoi #${match.tournamentId}`;
                    const hasScore = typeof match.scoreTeam1 === 'number' && typeof match.scoreTeam2 === 'number';
                    const score1 = Number(match.scoreTeam1);
                    const score2 = Number(match.scoreTeam2);
                    const scoreLabel = hasScore ? `${score1} - ${score2}` : 'Score indisponible';

                    let outcomeLabel = 'Terminé';
                    let outcomeColor = '#94a3b8';
                    let outcomeBackground = 'rgba(148,163,184,0.20)';
                    let outcomeBorder = '1px solid rgba(148,163,184,0.35)';

                    if (hasScore) {
                      if (isTeam1 || isTeam2) {
                        const myScore = isTeam1 ? score1 : score2;
                        const oppScore = isTeam1 ? score2 : score1;
                        if (myScore > oppScore) { outcomeLabel = 'Victoire'; outcomeColor = '#34d399'; outcomeBackground = 'rgba(16,185,129,0.20)'; outcomeBorder = '1px solid rgba(16,185,129,0.35)'; }
                        else if (myScore < oppScore) { outcomeLabel = 'Défaite'; outcomeColor = '#f87171'; outcomeBackground = 'rgba(239,68,68,0.20)'; outcomeBorder = '1px solid rgba(239,68,68,0.35)'; }
                        else { outcomeLabel = 'Nul'; outcomeColor = '#93c5fd'; outcomeBackground = 'rgba(59,130,246,0.20)'; outcomeBorder = '1px solid rgba(59,130,246,0.35)'; }
                      } else {
                        if (score1 > score2) { outcomeLabel = `Victoire de ${match.team1Name ?? 'Éq 1'}`; outcomeColor = '#34d399'; outcomeBackground = 'rgba(16,185,129,0.20)'; outcomeBorder = '1px solid rgba(16,185,129,0.35)'; }
                        else if (score1 < score2) { outcomeLabel = `Victoire de ${match.team2Name ?? 'Éq 2'}`; outcomeColor = '#34d399'; outcomeBackground = 'rgba(16,185,129,0.20)'; outcomeBorder = '1px solid rgba(16,185,129,0.35)'; }
                        else { outcomeLabel = 'Match nul'; outcomeColor = '#93c5fd'; outcomeBackground = 'rgba(59,130,246,0.20)'; outcomeBorder = '1px solid rgba(59,130,246,0.35)'; }
                      }
                    }

                    return (
                      <Box key={match.id} role="button" tabIndex={0}
                        onClick={() => navigate(`/tournois/${match.tournamentId}/matchs/${match.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/tournois/${match.tournamentId}/matchs/${match.id}`); } }}
                        sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, cursor: 'pointer', transition: 'border-color 0.2s ease, transform 0.2s ease', '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-2px)' } }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="white">{matchTitle}</Typography>
                          <Typography variant="caption" color="rgba(255,255,255,0.45)">
                            {tournamentName}{match.round != null ? ` · ${getRoundLabelFromMax(match.round, maxRound)}` : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={800} color="rgba(255,255,255,0.75)">{formatMatchDateTime(match.scheduledDateTime)}</Typography>
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center" sx={{ mt: 0.7 }}>
                            <Chip label={scoreLabel} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.20)', color: '#93c5fd', fontWeight: 700, fontSize: 10, border: '1px solid rgba(59,130,246,0.35)' }} />
                            <Chip label={outcomeLabel} size="small" sx={{ bgcolor: outcomeBackground, color: outcomeColor, fontWeight: 700, fontSize: 10, border: outcomeBorder }} />
                          </Stack>
                        </Box>
                      </Box>
                    );
                  })}
                  {matches.length > PREVIEW_LIMIT && (
                    <Button variant="text" size="small" onClick={() => setMatchDialogOpen(true)}
                      sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', '&:hover': { color: '#3b82f6' } }}
                    >
                      + {matches.length - PREVIEW_LIMIT} autres matchs…
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </Container>

      {/* ── Pop-ups ── */}
      <TournoiDialog
        open={tournoiDialogOpen}
        onClose={() => setTournoiDialogOpen(false)}
        tournaments={participatedTournaments}
        onNavigate={(tid) => navigate(`/tournois/${tid}`)}
      />
      <MatchDialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        matches={matches}
        teamId={teamId}
        participatedTournaments={participatedTournaments}
        maxRound={maxRound}
        onNavigate={(tournamentId, matchId) => navigate(`/tournois/${tournamentId}/matchs/${matchId}`)}
      />
    </Box>
  );
}