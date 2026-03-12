import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DisponibilitesPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        {/* Bouton pour revenir au profil */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profil')}
          sx={{ mb: 3, color: '#e8822a' }}
        >
          Retour au profil
        </Button>

        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h4" color="white" fontWeight={700} gutterBottom>
            Mes Disponibilités 📅
          </Typography>
          <Typography variant="body1" color="text.secondary">
            C'est ici que tu pourras bientôt indiquer tes jours d'absence.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default DisponibilitesPage;
