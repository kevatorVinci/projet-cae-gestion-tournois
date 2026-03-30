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
import { getAllEquipes } from '../../../services/teams';
import BackButton from '../../../components/BoutonRetour';

export default function MemberDetails() {
  // "id" can be a tag (from TeamsList) or a numeric id (from MaTeam)
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { authenticatedUser } = useContext(UserContext);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  useEffect(() => {
    const fetchUser = async () => {
      // Guard: do nothing if id is missing or literally "undefined"
      if (!id || id === 'undefined') {
        return;
      }

      // Decode in case the tag was URL-encoded (e.g. spaces => %20)
      const decodedId = decodeURIComponent(id);

      try {
        const equipes = await getAllEquipes().catch(() => []);

        const token =
          authenticatedUser?.token || getAuthenticatedUser()?.token || '';

        const playersResponse = await fetch('/api/auths/players', {
          headers: { Authorization: token },
        });

        let players: any[] = [];
        if (playersResponse.ok) {
          players = await playersResponse.json();
        }

        // Match by tag (string from TeamsList) or by numeric id (from MaTeam)
        const playerBase = players.find(
          (p: any) => p.tag === decodedId || String(p.id) === decodedId,
        );

        let foundUserInTeam: any = null;
        let userTeamName = '';

        for (const equipe of equipes) {
          const listJoueurs = equipe.members || [];
          const member = listJoueurs.find(
            (m: any) => m.tag === decodedId || String(m.id) === decodedId,
          );
          if (member) {
            foundUserInTeam = member;
            userTeamName = equipe.name;
            break;
          }
        }

        if (playerBase) {
          setUser({
            id: playerBase.id || 0,
            tag: playerBase.tag,
            email: playerBase.email || '',
            specialty: playerBase.specialty || 'Unknown',
            team: userTeamName,
            profileImage:
              playerBase.profileImage ||
              playerBase.profileImageUrl ||
              '/luffy.png',
            isResponsable: foundUserInTeam?.isResponsable || false,
            admin: playerBase.admin || false,
          });
        } else if (foundUserInTeam) {
          setUser({
            id: foundUserInTeam.id,
            tag: foundUserInTeam.tag,
            email: '',
            specialty: foundUserInTeam.specialty || 'Unknown',
            team: userTeamName,
            profileImage: foundUserInTeam.profileImageUrl || '/luffy.png',
            isResponsable: foundUserInTeam.isResponsable || false,
            admin: false,
          });
        }
      } catch (error) {
        console.error('Erreur lors de la recuperation des donnees :', error);
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
        <Typography color="white">
          Recherche du profil de {id ? decodeURIComponent(id) : ''}...
        </Typography>
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
                    Specialite
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  {user.specialty || 'Non specifiee'}
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
                    Equipe
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={600}>
                  {user.team || 'Aucune equipe'}
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
                    Tournois & Resultats
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  Aucun resultat disponible pour le moment.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
