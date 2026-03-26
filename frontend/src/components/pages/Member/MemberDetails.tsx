import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Container,
  Stack,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { UserContext } from '../../../contexts/UserContext';
import { User } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';

interface Match {
  id: number;
  tournament: string;
  teamA: string;
  scoreA: number;
  teamB: string;
  scoreB: number;
  playerParticipated: boolean;
  won: boolean;
}

interface Tournament {
  id: number;
  name: string;
  position: string;
  matches: Match[];
}

export default function MemberDetails() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [expandedTournaments, setExpandedTournaments] = useState<
    Record<number, boolean>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const { authenticatedUser } = useContext(UserContext);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  const mockTournaments: Tournament[] = [
    {
      id: 1,
      name: 'Championship Cup 2026',
      position: '1er',
      matches: [
        {
          id: 1,
          tournament: 'Championship Cup 2026',
          teamA: 'Les Tacticiens',
          scoreA: 3,
          teamB: 'Team Phoenix',
          scoreB: 0,
          playerParticipated: true,
          won: true,
        },
        {
          id: 2,
          tournament: 'Championship Cup 2026',
          teamA: 'Les Tacticiens',
          scoreA: 2,
          teamB: 'Shadow Squad',
          scoreB: 1,
          playerParticipated: true,
          won: true,
        },
        {
          id: 3,
          tournament: 'Championship Cup 2026',
          teamA: 'Team Phoenix',
          scoreA: 1,
          teamB: 'Shadow Squad',
          scoreB: 2,
          playerParticipated: false,
          won: false,
        },
      ],
    },
    {
      id: 2,
      name: 'Spring Tournament',
      position: 'Demi-Finale',
      matches: [
        {
          id: 4,
          tournament: 'Spring Tournament',
          teamA: 'Les Tacticiens',
          scoreA: 2,
          teamB: 'Velocity Team',
          scoreB: 2,
          playerParticipated: true,
          won: false,
        },
      ],
    },
    {
      id: 3,
      name: 'Battle Royale 2026',
      position: '3ème',
      matches: [
        {
          id: 5,
          tournament: 'Battle Royale 2026',
          teamA: 'Les Tacticiens',
          scoreA: 4,
          teamB: 'Dragon Slayers',
          scoreB: 1,
          playerParticipated: true,
          won: true,
        },
        {
          id: 6,
          tournament: 'Battle Royale 2026',
          teamA: 'Les Tacticiens',
          scoreA: 1,
          teamB: 'Titans Squad',
          scoreB: 3,
          playerParticipated: true,
          won: false,
        },
        {
          id: 7,
          tournament: 'Battle Royale 2026',
          teamA: 'Dragon Slayers',
          scoreA: 2,
          teamB: 'Titans Squad',
          scoreB: 2,
          playerParticipated: false,
          won: false,
        },
      ],
    },
    {
      id: 4,
      name: 'Summer League',
      position: 'Finale',
      matches: [
        {
          id: 8,
          tournament: 'Summer League',
          teamA: 'Les Tacticiens',
          scoreA: 5,
          teamB: 'Rising Stars',
          scoreB: 0,
          playerParticipated: true,
          won: true,
        },
        {
          id: 9,
          tournament: 'Summer League',
          teamA: 'Les Tacticiens',
          scoreA: 3,
          teamB: 'Elite Team',
          scoreB: 2,
          playerParticipated: true,
          won: true,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        try {
          const token =
            authenticatedUser?.token || getAuthenticatedUser()?.token || '';

          // Fetch all teams to find the member
          const response = await fetch(`/api/equipes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch teams');
          }

          const equipes: any[] = await response.json();

          // Search through all teams for the member with matching id
          let foundUser = null;
          let userTeamName = '';

          for (const equipe of equipes) {
            const member = equipe.membres?.find(
              (m: { id: number }) => m.id === Number(id),
            );
            if (member) {
              foundUser = member;
              userTeamName = equipe.name;
              break;
            }
          }

          if (foundUser) {
            // Map the backend member data to our User type
            const user: User = {
              id: foundUser.id,
              tag: foundUser.tag,
              email: '', // Not available in public API
              specialty: foundUser.specialty || 'Unknown',
              team: userTeamName,
              profileImage: foundUser.profileImageUrl || '/luffy.png',
              isResponsable: foundUser.isResponsable || false,
              admin: false, // Not available in public API
            };
            setUser(user);
          } else {
            console.log('User not found in any team');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUser();
  }, [id, authenticatedUser]);

  const toggleTournament = (tournamentId: number) => {
    setExpandedTournaments((prev: Record<number, boolean>) => ({
      ...prev,
      [tournamentId]: !prev[tournamentId],
    }));
  };

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

  const getMatchColor = (match: Match) => {
    if (!match.playerParticipated) return 'transparent';
    return match.won ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
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
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Tag Box - Full Width */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#111827',
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                src={normalizeAvatarUrl(user.profileImage)}
                alt={user.tag}
                sx={{ width: 120, height: 120 }}
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

          {/* Main Content Section */}
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            {/* Left Side - Info Boxes */}
            <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
              {/* Specialty Box */}
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

              {/* Team Box */}
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
                  <GroupsIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Équipe
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  {user.team || 'Aucune équipe'}
                </Typography>
              </Box>

              {/* Status Box */}
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
                  <StarIcon sx={{ color: '#e8822a', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Statut
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  Actif
                </Typography>
              </Box>
            </Stack>

            {/* Right Side - Tournaments & Results */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                  maxHeight: 600,
                  overflow: 'auto',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2.5,
                  }}
                >
                  <EmojiEventsIcon sx={{ color: '#e8822a', fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={700} color="white">
                    Tournois & Résultats
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {mockTournaments.map((tournament) => (
                    <Box
                      key={tournament.id}
                      sx={{
                        borderRadius: 1.5,
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                        onClick={() => toggleTournament(tournament.id)}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            color="white"
                          >
                            {tournament.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Position:{' '}
                            <span style={{ color: '#e8822a' }}>
                              {tournament.position}
                            </span>
                          </Typography>
                        </Box>
                        <IconButton
                          sx={{
                            transform: expandedTournaments[tournament.id]
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <ExpandMoreIcon sx={{ color: '#e8822a' }} />
                        </IconButton>
                      </Box>

                      <Collapse in={expandedTournaments[tournament.id]}>
                        <Box
                          sx={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            p: 2,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                          }}
                        >
                          <Stack spacing={1}>
                            {tournament.matches.map((match, index) => (
                              <Box key={match.id}>
                                <Box
                                  sx={{
                                    bgcolor: getMatchColor(match),
                                    p: 1.5,
                                    borderRadius: 1,
                                    textDecoration: match.playerParticipated
                                      ? 'underline'
                                      : 'none',
                                    textDecorationColor: match.won
                                      ? '#4CAF50'
                                      : '#F44336',
                                    textDecorationThickness: '2px',
                                    textUnderlineOffset: '4px',
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="white"
                                    sx={{ wordBreak: 'break-word' }}
                                  >
                                    {match.teamA}{' '}
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: '#e8822a',
                                      }}
                                    >
                                      {match.scoreA} - {match.scoreB}
                                    </span>{' '}
                                    {match.teamB}
                                  </Typography>
                                </Box>
                                {index < tournament.matches.length - 1 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      my: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        height: '1px',
                                        width: '80%',
                                        backgroundColor:
                                          'rgba(255,255,255,0.1)',
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
