import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  Avatar,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { getAllEquipes, joinEquipe } from '../../../services/teams';
import { Equipe } from '../../../types';

export function RejoindreEquipe() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Equipe[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    getAllEquipes()
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filtrage dynamique comme dans ton script HTML
  const filteredTeams = useMemo(() => {
    return teams.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [teams, query]);

  const handleJoin = async (teamId: number, teamName: string) => {
    try {
      await joinEquipe(teamId);
      setMessage({
        type: 'success',
        text: `Demande envoyée pour rejoindre ${teamName} ! 🛡️`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: "Erreur lors de l'envoi de la demande.",
      });
    }
  };

  if (loading)
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
        <CircularProgress color="secondary" />
      </Box>
    );

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={700} color="white">
            Vinci Arena
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Recherchez une équipe à rejoindre.
          </Typography>
        </Box>

        {/* BARRE DE RECHERCHE */}
        <Paper
          sx={{
            p: 2,
            mb: 4,
            display: 'flex',
            gap: 2,
            borderRadius: 2,
            backgroundColor: '#1a2540',
          }}
        >
          <TextField
            fullWidth
            placeholder="Rechercher par nom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Paper>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {filteredTeams.map((team) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#1a2540',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: '#080b14',
                        borderRadius: 1,
                        width: 50,
                        height: 50,
                      }}
                    >
                      {team.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} color="white">
                      {team.name}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    👑 Responsable : À définir
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    👥 0 Membres
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(`/equipes/${team.id}`)}
                    sx={{ mb: 1.2 }}
                  >
                    Voir les détails
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleJoin(team.id, team.name)}
                    sx={{
                      bgcolor: '#e8822a',
                      '&:hover': { bgcolor: '#c86e20' },
                    }}
                  >
                    Postuler
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
