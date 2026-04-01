import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BuildIcon from '@mui/icons-material/Build';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { User, UserContextType } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';
import { getAllEquipes } from '../../../services/teams';
import BackButton from '../../../components/BoutonRetour';
import { UserContext } from '../../../contexts/UserContext';

interface Player {
  tag: string;
  id: number;
  email?: string;
  specialty?: string;
  profileImage?: string;
  profileImageUrl?: string;
  admin?: boolean;
  isResponsable?: boolean;
  password?: string;
}

interface TournamentRegistration {
  tournoiId: number;
  equipeId: number;
  tournoi?: {
    nom: string;
    etat?: string;
  };
}

const pageGradient =
  'linear-gradient(135deg, #0f172a 0%, #1a2540 50%, #0f172a 100%)';

const fetchTeamRegistrationsPublic = async (
  teamId: number,
): Promise<TournamentRegistration[]> => {
  const token = getAuthenticatedUser()?.token || '';
  const response = await fetch(`/api/teams/${teamId}/registrations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch registrations');
  return response.json();
};

const capitalize = (str?: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<TournamentRegistration[]>([]);
  const { authenticatedUser } = useContext(UserContext) as UserContextType;

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://'))
      return avatar;
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      if (!id || id === 'undefined') {
        setLoading(false);
        return;
      }

      const decodedId = decodeURIComponent(id);
      setLoading(true);

      try {
        const token =
          authenticatedUser?.token || getAuthenticatedUser()?.token || '';

        let players: Player[] = [];
        try {
          const playersResponse = await fetch('/api/auths/players', {
            headers: { Authorization: token ? `Bearer ${token}` : '' }, // Format Bearer
          });
          if (playersResponse.ok) {
            players = await playersResponse.json();
          }
        } catch (e) {
          // Silently ignore player fetch error
        }

        const playerBase = players.find(
          (p: Player) => p.tag === decodedId || String(p.id) === decodedId,
        );

        const equipes = await getAllEquipes().catch(() => []);
        let foundUserInTeam: Player | null = null;
        let userTeamName = '';
        let foundTeamId: number | null = null;

        for (const equipe of equipes) {
          const listJoueurs = (equipe.members || []) as Player[];
          const member = listJoueurs.find(
            (m: Player) => m.tag === decodedId || String(m.id) === decodedId,
          );
          if (member) {
            foundUserInTeam = member;
            userTeamName = equipe.name;
            foundTeamId = equipe.id;
            break;
          }
        }

        // 3. Assemble les données (priorité à playerBase, sinon les données de l'équipe)
        if (playerBase || foundUserInTeam) {
          const finalId = playerBase?.id || foundUserInTeam?.id || 0;
          const finalTag = playerBase?.tag || foundUserInTeam?.tag || '';
          const finalSpecialty =
            playerBase?.specialty ||
            foundUserInTeam?.specialty ||
            'Non spécifiée';

          setUser({
            id: finalId,
            tag: finalTag,
            email: playerBase?.email || '',
            specialty: finalSpecialty,
            team: userTeamName || 'Aucune équipe',
            profileImage:
              playerBase?.profileImage ||
              playerBase?.profileImageUrl ||
              foundUserInTeam?.profileImageUrl ||
              '/luffy.png',
            isResponsable: foundUserInTeam?.isResponsable || false,
            admin: playerBase?.admin || false,
            password: playerBase?.password, // Récupère le mot de passe s'il est là
          });
          setTeamId(foundTeamId);
        }
      } catch (error) {
        console.error('Erreur globale lors de la récupération:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTeam();
  }, [id, authenticatedUser]);

  useEffect(() => {
    const loadTournaments = async () => {
      if (teamId === null) return;
      try {
        const registrations = await fetchTeamRegistrationsPublic(teamId);
        setTournaments(registrations);
      } catch {
        setTournaments([]);
      }
    };
    loadTournaments();
  }, [teamId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageGradient,
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageGradient,
        }}
      >
        <Typography color="white">
          Recherche du profil de {id ? decodeURIComponent(id) : ''}...
        </Typography>
        <Paper
          sx={{
            p: 4,
            bgcolor: '#1a2540',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}
        >
          <SportsEsportsIcon
            sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }}
          />
          <Typography variant="h6" color="white">
            Joueur introuvable
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.5)"
            sx={{ mt: 1 }}
          >
            Ce profil n'existe pas ou n'est plus disponible.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const normalizeState = (etat?: string): string => (etat || '').toUpperCase();

  const pastTournaments = tournaments.filter(
    (r) => normalizeState(r.tournoi?.etat) === 'TERMINE',
  );
  const activeTournaments = tournaments.filter(
    (r) => normalizeState(r.tournoi?.etat) === 'EN_COURS',
  );
  const upcomingTournaments = tournaments.filter((r) => {
    const etat = normalizeState(r.tournoi?.etat);
    return etat === 'OUVERT' || etat === 'CLOTURE';
  });

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        background: pageGradient,
        pb: 6,
      }}
    >
      <Container maxWidth="lg">
        <BackButton />
        <Stack spacing={4}>
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#111827',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={3}
              sx={{ position: 'relative' }}
            >
              <Avatar
                src={normalizeAvatarUrl(user.profileImage)}
                alt={user.tag}
                sx={{
                  width: { xs: 120, md: 150 },
                  height: { xs: 120, md: 150 },
                  border: '3px solid #e8822a',
                  boxShadow: '0 0 30px rgba(232,130,42,0.3)',
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Tag
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color="#e8822a"
                  sx={{ mb: 1 }}
                >
                  {user.tag}
                </Typography>
              </Box>
              {isOwnProfile && (
                <Stack direction="column" spacing={2}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 'bold' }}
                    >
                      Mail
                    </Typography>
                    <Typography variant="body1" color="rgba(255,255,255,0.5)">
                      {authenticatedUser?.email || user.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 'bold' }}
                    >
                      Mot de Passe
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" color="rgba(255,255,255,0.5)">
                        {showPassword
                          ? authenticatedUser?.password ||
                            user.password ||
                            '********'
                          : '********'}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((prev) => !prev)}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Box>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <BuildIcon sx={{ color: '#e8822a', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Spécialité
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  {user.specialty || 'Non spécifiée'}
                </Typography>
              </Box>

              <Box
                role={teamId ? 'button' : undefined}
                tabIndex={teamId ? 0 : undefined}
                onClick={() => {
                  if (teamId) {
                    navigate(`/equipes/${teamId}`);
                  }
                }}
                onKeyDown={(event) => {
                  if (teamId && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigate(`/equipes/${teamId}`);
                  }
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                  cursor: teamId ? 'pointer' : 'default',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                  '&:hover': teamId
                    ? {
                        borderColor: '#e8822a',
                        transform: 'translateY(-2px)',
                      }
                    : undefined,
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <GroupsIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Équipe
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  {user.team || 'Aucune équipe'}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                  minHeight: 200,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#e8822a',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <EmojiEventsIcon sx={{ color: 'white', fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={700} color="white">
                    Tournois & Résultats
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', textAlign: 'center', mt: 4 }}
                >
                  Aucun résultat disponible pour le moment.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Container>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            bgcolor: '#1a2540',
          }}
        >
          <StatCard
            label="Tournois joués"
            value={pastTournaments.length}
            icon={<EmojiEventsIcon sx={{ color: '#10b981' }} />}
          />
          <StatCard
            label="En cours"
            value={activeTournaments.length}
            icon={<SportsEsportsIcon sx={{ color: '#f59e0b' }} />}
            border
          />
          <StatCard
            label="À venir"
            value={upcomingTournaments.length}
            icon={<EmojiEventsIcon sx={{ color: '#3b82f6' }} />}
          />
        </Paper>
      </Container>

      {/* ── DETAILS GRID ────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* LEFT: Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#1a2540',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              color="white"
              sx={{ mb: 2.5 }}
            >
              Informations
            </Typography>

            <InfoRow label="Tag" value={user.tag || '—'} />
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
            <InfoRow
              label="Spécialité"
              value={capitalize(user.specialty) || 'Non spécifiée'}
            />
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
            <InfoRow label="Équipe" value={user.team || 'Aucune équipe'} />
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
            <InfoRow
              label="Rôle"
              value={user.isResponsable ? 'Responsable' : 'Membre'}
              highlight={user.isResponsable}
            />
          </Paper>

          {/* RIGHT: Tournaments */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#1a2540',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}
            >
              <EmojiEventsIcon sx={{ color: '#e8822a' }} />
              <Typography variant="h6" fontWeight={700} color="white">
                Tournois
              </Typography>
            </Box>

            {tournaments.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <SportsEsportsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  Aucun tournoi pour le moment.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {activeTournaments.map((r) => (
                  <TournamentRow
                    key={`${r.tournoiId}-${r.equipeId}`}
                    name={r.tournoi?.nom || `Tournoi #${r.tournoiId}`}
                    status="EN COURS"
                    statusColor="#f59e0b"
                  />
                ))}
                {upcomingTournaments.map((r) => (
                  <TournamentRow
                    key={`${r.tournoiId}-${r.equipeId}`}
                    name={r.tournoi?.nom || `Tournoi #${r.tournoiId}`}
                    status="À VENIR"
                    statusColor="#3b82f6"
                  />
                ))}
                {pastTournaments.map((r) => (
                  <TournamentRow
                    key={`${r.tournoiId}-${r.equipeId}`}
                    name={r.tournoi?.nom || `Tournoi #${r.tournoiId}`}
                    status="TERMINÉ"
                    statusColor="#10b981"
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

/* ── SUB-COMPONENTS ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  border,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  border?: boolean;
}) {
  return (
    <Box
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderLeft: border
          ? { xs: 'none', sm: '1px solid rgba(255,255,255,0.06)' }
          : 'none',
        borderRight: border
          ? { xs: 'none', sm: '1px solid rgba(255,255,255,0.06)' }
          : 'none',
        borderTop: border
          ? { xs: '1px solid rgba(255,255,255,0.06)', sm: 'none' }
          : 'none',
        borderBottom: border
          ? { xs: '1px solid rgba(255,255,255,0.06)', sm: 'none' }
          : 'none',
      }}
    >
      {icon}
      <Box>
        <Typography
          variant="h5"
          fontWeight={700}
          color="white"
          sx={{ lineHeight: 1 }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="rgba(255,255,255,0.5)">
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" color="rgba(255,255,255,0.5)">
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={600}
        color={highlight ? '#e8822a' : 'white'}
      >
        {value}
      </Typography>
    </Box>
  );
}

function TournamentRow({
  name,
  status,
  statusColor,
}: {
  name: string;
  status: string;
  statusColor: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.2,
        px: 1.5,
        borderRadius: 1,
        bgcolor: 'rgba(255,255,255,0.03)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        transition: 'background 0.2s',
      }}
    >
      <Typography variant="body2" color="white" fontWeight={500}>
        {name}
      </Typography>
      <Chip
        label={status}
        size="small"
        sx={{
          bgcolor: `${statusColor}20`,
          color: statusColor,
          fontWeight: 700,
          fontSize: '0.65rem',
          height: 22,
        }}
      />
    </Box>
  );
}
