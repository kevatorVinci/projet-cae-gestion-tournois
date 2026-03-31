import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import { getEquipeById } from '../../../services/teams';
import { Equipe } from '../../../types';

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Equipe | null>(null);

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
      } catch (err: unknown) {
        console.error('Erreur API :', err);
      }
    };

    loadTeam();
  }, [id]);

  if (!team) {
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

  const sortedMembers = [...team.members].sort((a, b) => {
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

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="md" sx={{ mb: 1 }}>
        <Card
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.10)',
            backgroundColor: '#1a2540',
            mb: 4,
          }}
        >
          {/* ✨ WE ADDED DISPLAY FLEX TO ALIGN THE IMAGE AND TEXT ✨ */}
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 📸 TEAM IMAGE */}
            {team.profileImage && (
              <Avatar
                src={normalizeAvatarUrl(team.profileImage)}
                alt={team.name}
                variant="rounded" // Makes the avatar square with rounded corners
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

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }} color="white">
          Effectif de la Team
        </Typography>

        <Stack spacing={2}>
          {team.members.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Cette équipe n'a plus de membre.
            </Typography>
          )}

          {sortedMembers.map((member, index) => (
            <Card
              key={`${member.tag}-${index}`}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundColor: '#1a2540',
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={normalizeAvatarUrl(
                      member.profileImageUrl || member.profileImage,
                    )}
                    alt={member.tag}
                    sx={{ width: 56, height: 56 }}
                  />

                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="white"
                      onClick={() => {
                        navigate(`/players/${member.id}`);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { color: '#e8822a' },
                      }}
                    >
                      {member.tag}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {member.specialty ?? 'Membre'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
