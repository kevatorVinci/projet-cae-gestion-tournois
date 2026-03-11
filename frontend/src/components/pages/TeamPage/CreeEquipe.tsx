import { useContext, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createEquipe } from '../../../services/teams';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

export function CreateEquipe() {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticatedUser) {
      navigate('/login');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await createEquipe(teamName);
      navigate('/maTeam');
    } catch (err) {
      setError('Le nom est peut-être déjà pris ou le serveur est éteint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="sm" sx={{ mb: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
            Créer une Team ⚔️
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Réunissez vos alliés et forgez votre légende sur Vinci Arena.
          </Typography>
        </Box>

        <Paper
          elevation={2}
          sx={{ p: 4, borderRadius: 2, backgroundColor: '#1a2540' }}
        >
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
                  bgcolor: '#e8822a',
                  py: 1.5,
                  '&:hover': { bgcolor: '#c86e20' },
                }}
              >
                {loading ? 'Création en cours...' : "Fonder l'équipe"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
