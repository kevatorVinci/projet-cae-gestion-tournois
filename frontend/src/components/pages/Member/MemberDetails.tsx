import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { User } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';
import {
  fetchTeamRegistrationsPublic,
  TeamRegistrationItem,
} from '../../../services/tournois';

interface TeamMember {
  id: number;
  tag: string;
  specialty?: string;
  profileImageUrl?: string;
  isResponsable?: boolean;
}

interface Equipe {
  id: number;
  name: string;
  membres: TeamMember[];
}

const pageGradient =
  'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<TeamRegistrationItem[]>([]);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://'))
      return avatar;
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const token = getAuthenticatedUser()?.token || '';
        const response = await fetch(`/api/equipes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch teams');

        const equipes: Equipe[] = await response.json();
        let foundUser: TeamMember | null = null;
        let userTeamName = '';
        let foundTeamId: number | null = null;

        for (const equipe of equipes) {
          const member = equipe.membres?.find((m) => m.id === Number(id));
          if (member) {
            foundUser = member;
            userTeamName = equipe.name;
            foundTeamId = equipe.id;
            break;
          }
        }

        if (foundUser) {
          setUser({
            id: foundUser.id,
            tag: foundUser.tag,
            specialty: foundUser.specialty || 'Non spécifiée',
            team: userTeamName,
            profileImage: foundUser.profileImageUrl || '/luffy.png',
            isResponsable: foundUser.isResponsable || false,
          });
          setTeamId(foundTeamId);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

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
      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 8 },
          pb: { xs: 8, md: 10 },
          overflow: 'hidden',
        }}
      >
        {/* Orange glow */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(232,130,42,0.08), transparent)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            alignItems="center"
          >
            {/* Avatar */}
            <Box sx={{ position: 'relative' }}>
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
              {user.isResponsable && (
                <Chip
                  icon={
                    <StarIcon sx={{ fontSize: 14, color: '#fff !important' }} />
                  }
                  label="Responsable"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#e8822a',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>

            {/* Name & quick info */}
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  fontFamily: '"Orbitron", sans-serif',
                  color: '#e8822a',
                  textShadow: '0 0 20px rgba(232,130,42,0.3)',
                }}
              >
                {user.tag}
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  mt: 1.5,
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  label={capitalize(user.specialty) || 'Non spécifiée'}
                  variant="outlined"
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                />
                <Chip
                  icon={
                    <GroupsIcon
                      sx={{ fontSize: 16, color: '#9c27b0 !important' }}
                    />
                  }
                  label={user.team || 'Aucune équipe'}
                  variant="outlined"
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    cursor: user.team ? 'pointer' : 'default',
                  }}
                  onClick={
                    user.team ? () => navigate('/equipes/mateam') : undefined
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: -4 }}>
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
