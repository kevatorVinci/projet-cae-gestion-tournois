import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Container,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { UserContext } from '../../../contexts/UserContext';
import { User } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';

// Define the shape of the API response to avoid 'any'
interface TeamMember {
  id: number;
  tag: string;
  specialty?: string;
  profileImageUrl?: string;
  isResponsable?: boolean;
}

interface Equipe {
  name: string;
  membres: TeamMember[];
}

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>(); // Typed params
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { authenticatedUser } = useContext(UserContext);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        try {
          const token =
            authenticatedUser?.token || getAuthenticatedUser()?.token || '';

          const response = await fetch(`/api/equipes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch teams');
          }

          const equipes: Equipe[] = await response.json(); // Replaced any[] with Equipe[]

          let foundUser: TeamMember | null = null;
          let userTeamName = '';

          for (const equipe of equipes) {
            const member = equipe.membres?.find((m) => m.id === Number(id));
            if (member) {
              foundUser = member;
              userTeamName = equipe.name;
              break;
            }
          }

          if (foundUser) {
            const userData: User = {
              id: foundUser.id,
              tag: foundUser.tag,
              email: '',
              specialty: foundUser.specialty || 'Unknown',
              team: userTeamName,
              profileImage: foundUser.profileImageUrl || '/luffy.png',
              isResponsable: foundUser.isResponsable || false,
              admin: false,
            };
            setUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUser();
  }, [id, authenticatedUser]);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
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
            </Stack>

            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                  minHeight: 200,
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  Aucun résultat disponible pour le moment.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
