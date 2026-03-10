import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createEquipe } from '../../../services/teams';

export function CreateEquipe() {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createEquipe(teamName);
      // Succès ! On redirige vers l'espace personnel ou la page "Ma Team"
      navigate('/profil');
    } catch (err) {
      setError('Le nom est peut-être déjà pris ou le serveur est éteint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        backgroundColor: '#f0f2f5',
        minHeight: '90vh',
        paddingTop: '40px',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color="#0f172a"
            gutterBottom
          >
            Créer une Team ⚔️
          </Typography>
          <Typography variant="body1" color="#64748b">
            Réunissez vos alliés et forgez votre légende sur Vinci Arena.
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nom de l'équipe"
                variant="outlined"
                placeholder="Ex: Les Architectes du Chaos"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !teamName.trim()}
                sx={{
                  bgcolor: '#112b4f',
                  py: 1.5,
                  '&:hover': { bgcolor: '#1e40af' },
                }}
              >
                {loading ? 'Création en cours...' : "Fonder l'équipe"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </main>
  );
}
