import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import {
  getMesIndisponibilites,
  addIndisponibilite,
  deleteIndisponibilite,
  Period,
} from '../../../services/indisponibilites';

const DisponibilitesPage = () => {
  const navigate = useNavigate();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMesIndisponibilites()
      .then((data) => {
        setPeriods(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger vos données.');
        setLoading(false);
      });
  }, []);

  const handleAddPeriod = async () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }
    if (startDate.isAfter(endDate)) {
      setError('La date de fin ne peut pas être avant la date de début.');
      return;
    }

    try {
      const newPeriod = await addIndisponibilite(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
      );
      setPeriods([...periods, newPeriod]);
      setStartDate(null);
      setEndDate(null);
      setError('');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        `Erreur: ${error?.response?.data?.message || error?.message || 'inconnue'}`,
      );
    }
  };

  const handleDeletePeriod = async (idToRemove: number) => {
    try {
      await deleteIndisponibilite(idToRemove);
      setPeriods(periods.filter((period) => period.id !== idToRemove));
    } catch (err) {
      setError('Erreur lors de la suppression.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: 5,
        background: 'transparent',
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profil')}
          sx={{ mb: 3, color: '#e8822a' }}
        >
          Retour au profil
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EventIcon sx={{ fontSize: 32, color: '#e8822a' }} />
          <Typography variant="h4" color="white" fontWeight={700}>
            Mes Indisponibilités
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Indique ici les périodes où tu ne pourras pas participer aux matchs.
        </Typography>

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
            Ajouter une période
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            {' '}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems="center"
            >
              <DatePicker
                label="Date de début"
                value={startDate}
                onChange={(val: Dayjs | null) => setStartDate(val)}
                disablePast
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      input: { color: 'white' },
                      label: { color: '#e8822a' },
                    },
                  },
                }}
              />
              <DatePicker
                label="Date de fin"
                value={endDate}
                onChange={(val: Dayjs | null) => setEndDate(val)}
                disablePast
                minDate={startDate || dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      input: { color: 'white' },
                      label: { color: '#e8822a' },
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddPeriod}
                sx={{
                  py: 1.5,
                  px: 4,
                  backgroundColor: '#e8822a',
                  '&:hover': { backgroundColor: '#c86e20' },
                }}
              >
                Ajouter
              </Button>
            </Stack>
          </LocalizationProvider>
        </Paper>

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
            Mes absences prévues
          </Typography>

          {loading ? (
            <CircularProgress sx={{ color: '#e8822a', mt: 2 }} />
          ) : periods.length === 0 ? (
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
                    primary={`Du ${new Date(period.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(period.dateFin).toLocaleDateString('fr-FR')}`}
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
