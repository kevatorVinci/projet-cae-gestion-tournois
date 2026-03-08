import { useState, useEffect, useMemo } from 'react';
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
import { getAllEquipes, joinEquipe } from '../../../api/teams';
import { Equipe } from '../../../types';

export function RejoindreEquipe() {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" fontWeight={700} color="#0f172a">
          Vinci Arena
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Recherchez une équipe à rejoindre.
        </Typography>
      </Box>

      {/* BARRE DE RECHERCHE */}
      <Paper sx={{ p: 2, mb: 4, display: 'flex', gap: 2, borderRadius: 2 }}>
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
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: '#112b4f',
                      borderRadius: 1,
                      width: 50,
                      height: 50,
                    }}
                  >
                    {team.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
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
                  variant="contained"
                  onClick={() => handleJoin(team.id, team.name)}
                  sx={{ bgcolor: '#112b4f', '&:hover': { bgcolor: '#1e40af' } }}
                >
                  Postuler
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
