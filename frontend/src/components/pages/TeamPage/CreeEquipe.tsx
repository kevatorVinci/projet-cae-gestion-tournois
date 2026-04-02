import { useContext, useState } from 'react';
import BackButton from '../../../components/BoutonRetour/';
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

  const teamImages = [
    'akatsuki.jpg',
    'espada.jpg',
    'fairytail.jpg',
    'hunter.jpg',
    'onepiece.jpg',
  ];

  // State to track the selected image (defaults to the first one)
  const [profileImage, setProfileImage] = useState(teamImages[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticatedUser) {
      navigate('/login');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await createEquipe(teamName, profileImage);
      navigate('/maTeam');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'équipe.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        background: 'transparent',
      }}
    >
      <Container maxWidth="sm" sx={{ mb: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <BackButton />
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
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.4)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#e8822a' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />

              {/* 📸 Team Image Selector */}
              <Box>
                <Typography
                  variant="body2"
                  color="rgba(255, 255, 255, 0.7)"
                  textAlign="center"
                  mb={1.5}
                >
                  Emblème de l'équipe *
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  {teamImages.map((img) => (
                    <Box
                      key={img}
                      component="img"
                      src={`/${img}`}
                      alt={`Emblème ${img}`}
                      onClick={() => setProfileImage(img)}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border:
                          profileImage === img
                            ? '3px solid #ffffff'
                            : '3px solid transparent',
                        opacity: profileImage === img ? 1 : 0.5,
                        transition: 'all 0.2s ease-in-out',
                        objectFit: 'cover',
                        '&:hover': { transform: 'scale(1.1)', opacity: 1 },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !teamName.trim()}
                sx={{
                  bgcolor: '#e8822a',
                  color: 'white',
                  py: 1.5,
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#c86e20' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)',
                  },
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
