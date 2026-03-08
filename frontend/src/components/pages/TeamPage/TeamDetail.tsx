import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import { getEquipeById, type Equipe } from '../../../api/teams.ts';

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Equipe | null>(null);

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
      <Container sx={{ mt: 5 }}>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 6 }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        ← Retour
      </Button>

      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.10)',
          backgroundColor: 'background.paper',
          mb: 4,
        }}
      >
        <CardContent>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {team.name}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Responsable : {team.responsable?.tag ?? 'N/A'}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Membres : {team.members.length}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Effectif de la Team
      </Typography>

      <Stack spacing={2}>
        {team.members.map((member, index) => (
          <Card
            key={`${member.tag}-${index}`}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.10)',
              backgroundColor: 'background.paper',
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={member.avatar}
                  alt={member.tag}
                  sx={{ width: 56, height: 56 }}
                />

                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {member.tag}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {member.speciality ?? 'Membre'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {member.role === 'RESPONSABLE' ? 'Responsable' : 'Membre'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
