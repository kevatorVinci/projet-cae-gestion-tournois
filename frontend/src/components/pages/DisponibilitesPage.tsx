import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Period {
  id: string;
  startDate: string;
  endDate: string;
}

const DisponibilitesPage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [periods, setPeriods] = useState<Period[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Quand on clique sur le bouton "Ajouter"
  const handleAddPeriod = () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }

    // 2. On vérifie que la fin n'est pas avant le début
    if (new Date(startDate) > new Date(endDate)) {
      setError('La date de fin ne peut pas être avant la date de début.');
      return;
    }

    const newPeriod: Period = {
      id: Date.now().toString(),
      startDate,
      endDate,
    };

    // 4. On l'ajoute à notre liste et on vide le formulaire
    setPeriods([...periods, newPeriod]);
    setStartDate('');
    setEndDate('');
    setError(''); // On efface les erreurs
  };

  // Quand on clique sur la poubelle pour supprimer une période
  const handleDeletePeriod = (idToRemove: string) => {
    setPeriods(periods.filter((period) => period.id !== idToRemove));
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        {/* Bouton retour */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profil')}
          sx={{ mb: 3, color: '#e8822a' }}
        >
          Retour au profil
        </Button>

        {/* Titre de la page */}
        <Typography variant="h4" color="white" fontWeight={700} gutterBottom>
          Mes Indisponibilités 📅
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Indique ici les périodes où tu ne pourras pas participer aux matchs.
          En dehors de ces dates, tu seras considéré comme disponible pour ton
          équipe.
        </Typography>

        {/* Formulaire d'ajout */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Ajouter une période d'absence
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            alignItems="center"
          >
            <TextField
              fullWidth
              type="date"
              label="Date de début"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ input: { color: 'white' }, label: { color: '#e8822a' } }}
            />

            <TextField
              fullWidth
              type="date"
              label="Date de fin"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate || today }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ input: { color: 'white' }, label: { color: '#e8822a' } }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPeriod}
              sx={{
                py: 1.5,
                px: 4,
                whiteSpace: 'nowrap',
                backgroundColor: '#e8822a',
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Ajouter
            </Button>
          </Stack>
        </Paper>

        {/* Liste des indisponibilités enregistrées */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Mes absences prévues ({periods.length})
          </Typography>

          {periods.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontStyle: 'italic' }}
            >
              Tu n'as aucune indisponibilité de prévue. Tu es prêt à combattre !
              ⚔️
            </Typography>
          ) : (
            <List>
              {periods.map((period) => (
                <ListItem
                  key={period.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeletePeriod(period.id)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <ListItemText
                    primary={`Du ${new Date(period.startDate).toLocaleDateString('fr-FR')} au ${new Date(period.endDate).toLocaleDateString('fr-FR')}`}
                    primaryTypographyProps={{ color: 'white', fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default DisponibilitesPage;
