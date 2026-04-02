import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
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
  isResponsable?: boolean;
}

const pageGradient =
  'linear-gradient(135deg, #0f172a 0%, #1a2540 50%, #0f172a 100%)';

const capitalize = (value?: string): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticatedUser } = useContext(UserContext) as UserContextType;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<number | null>(null);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
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
            headers: { Authorization: token ? `Bearer ${token}` : '' },
          });
          if (playersResponse.ok) {
            players = await playersResponse.json();
          }
        } catch {
          // Ignore player fetch errors and continue with team data.
        }

        const playerBase = players.find(
          (player) =>
            player.tag === decodedId || String(player.id) === decodedId,
        );

        const equipes = await getAllEquipes().catch(() => []);
        let foundUserInTeam: Player | null = null;
        let userTeamName = '';
        let foundTeamId: number | null = null;

        for (const equipe of equipes) {
          const listJoueurs = (equipe.members || []) as Player[];
          const member = listJoueurs.find(
            (currentMember) =>
              currentMember.tag === decodedId ||
              String(currentMember.id) === decodedId,
          );
          if (member) {
            foundUserInTeam = member;
            userTeamName = equipe.name;
            foundTeamId = equipe.id;
            break;
          }
        }

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
          });

          setTeamId(foundTeamId);
        } else {
          setUser(null);
          setTeamId(null);
        }
      } catch (error) {
        console.error('Erreur globale lors de la récupération:', error);
        setUser(null);
        setTeamId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTeam();
  }, [id, authenticatedUser]);

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
          px: 2,
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
          <PersonIcon
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
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        background: pageGradient,
        pt: { xs: 2, sm: 3 },
        pb: 6,
      }}
    >
      <Container maxWidth="lg">
        <BackButton />

        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#111827',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(232,130,42,0.10), transparent 30%)',
                pointerEvents: 'none',
              }}
            />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'center', md: 'center' }}
              spacing={3}
              sx={{ position: 'relative' }}
            >
              <Avatar
                src={normalizeAvatarUrl(user.profileImage)}
                alt={user.tag}
                sx={{
                  width: { xs: 110, md: 140 },
                  height: { xs: 110, md: 140 },
                  border: '3px solid #e8822a',
                  boxShadow: '0 0 30px rgba(232,130,42,0.25)',
                }}
              />

              <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  {isOwnProfile ? 'Mes détails publics' : 'Profil joueur'}
                </Typography>

                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="#e8822a"
                  sx={{ mb: 1, lineHeight: 1.05 }}
                >
                  {user.tag}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <Chip
                    label={user.isResponsable ? 'Responsable' : 'Membre'}
                    sx={{
                      bgcolor: user.isResponsable
                        ? 'rgba(232,130,42,0.14)'
                        : 'rgba(255,255,255,0.08)',
                      color: user.isResponsable ? '#e8822a' : 'white',
                      fontWeight: 700,
                    }}
                  />
                  {isOwnProfile && (
                    <Chip
                      label="Moi"
                      sx={{
                        bgcolor: 'rgba(16,185,129,0.14)',
                        color: '#34d399',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="white"
                sx={{ mb: 2.5 }}
              >
                Informations personnelles
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Tag
                </Typography>
                <Typography variant="body1" fontWeight={600} color="white">
                  {user.tag || '—'}
                </Typography>
              </Box>
              <Divider
                sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
              />

              {isOwnProfile && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">
                      Email
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="white"
                      sx={{ textAlign: 'right' }}
                    >
                      {user.email || '—'}
                    </Typography>
                  </Box>
                  <Divider
                    sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
                  />
                </>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Spécialité
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color="white"
                  sx={{ textAlign: 'right' }}
                >
                  {capitalize(user.specialty) || 'Non spécifiée'}
                </Typography>
              </Box>
              <Divider
                sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Rôle
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={user.isResponsable ? '#e8822a' : 'white'}
                  sx={{ textAlign: 'right' }}
                >
                  {user.isResponsable ? 'Responsable' : 'Membre'}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="white"
                sx={{ mb: 2.5 }}
              >
                Équipe
              </Typography>

              <Box
                role={teamId ? 'button' : undefined}
                tabIndex={teamId ? 0 : undefined}
                onClick={() => {
                  if (teamId) navigate(`/equipes/${teamId}`);
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
                  backgroundColor: 'rgba(255,255,255,0.02)',
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
                    Équipe actuelle
                  </Typography>
                </Box>

                <Typography variant="h6" color="white" fontWeight={700}>
                  {user.team || 'Aucune équipe'}
                </Typography>

                <Typography
                  variant="body2"
                  color="rgba(255,255,255,0.5)"
                  sx={{ mt: 1 }}
                >
                  {teamId
                    ? 'Cliquez pour consulter la page de l’équipe.'
                    : 'Ce joueur ne fait actuellement partie d’aucune équipe.'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
