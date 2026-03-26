import { useState, useEffect, FormEvent, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import BackButton from '../BoutonRetour';
import {
  fetchTournamentById,
  updateTournament,
  NewTournamentPayload,
} from '../../services/tournois';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

/**
 * Page dedicated to editing an existing tournament.
 * It fetches the current data, pre-fills the form, and allows the admin to save changes.
 * Includes security to prevent selecting past dates.
 *
 * @return {JSX.Element} the tournament editing page
 */
const EditTournamentPage = () => {
  const navigate = useNavigate();
  // We get the ID from the URL (now it is /edit/:id)
  const { id } = useParams<{ id: string }>();
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  // Form memory variables
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [nombresParticipantsMax, setNombresParticipantsMax] = useState<
    number | ''
  >('');

  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null);
  const [dateFin, setDateFin] = useState<Dayjs | null>(null);
  const [dateLimiteInscription, setDateLimiteInscription] =
    useState<Dayjs | null>(null);

  // Status variables
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // ✨ SÉCURITÉ : We calculate tomorrow's date to block the past
  const tomorrow = dayjs().add(1, 'day');

  /**
   * Function to load the tournament data when the page opens.
   */
  useEffect(() => {
    const loadTournamentData = async () => {
      if (!id) return;
      try {
        setLoadingData(true);
        const data = await fetchTournamentById(id);

        setNom(data.nom);
        setDescription(data.description);
        setNombresParticipantsMax(data.nombresParticipantsMax);

        setDateDebut(dayjs(data.dateDebut));
        setDateFin(dayjs(data.dateFin));
        setDateLimiteInscription(dayjs(data.dateLimiteInscription));
      } catch (err) {
        setError('Impossible de charger les informations du tournoi.');
      } finally {
        setLoadingData(false);
      }
    };

    loadTournamentData();
  }, [id]);

  /**
   * Function called when submitting the form to save changes.
   *
   * @param {FormEvent} e - the event
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!dateDebut || !dateFin || !dateLimiteInscription) {
      setError('Veuillez remplir toutes les dates du calendrier.');
      return;
    }

    if (dateDebut.isBefore(dateLimiteInscription, 'day')) {
      setError(
        "La date de début du tournoi doit être après la date limite d'inscription.",
      );
      return;
    }

    if (dateFin.isBefore(dateDebut, 'day')) {
      setError(
        'La date de fin ne peut pas être avant la date de début du tournoi.',
      );
      return;
    }

    const token = authenticatedUser?.token;
    if (!token || !id) {
      setError("Vous devez être connecté en tant qu'administrateur.");
      return;
    }

    const payload: NewTournamentPayload = {
      nom,
      description,
      dateDebut: dateDebut.format('YYYY-MM-DD'),
      dateFin: dateFin.format('YYYY-MM-DD'),
      dateLimiteInscription: dateLimiteInscription.format('YYYY-MM-DD'),
      nombresParticipantsMax: Number(nombresParticipantsMax),
    };

    try {
      await updateTournament(id, payload, token);
      setSuccess('Le tournoi a été modifié avec succès !');
      setTimeout(() => navigate('/admin/tournaments'), 2000);
    } catch (err) {
      setError('Erreur lors de la modification du tournoi.');
    }
  };

  const darkInputStyle = {
    backgroundColor: '#111827',
    borderRadius: 1,
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&:hover fieldset': { borderColor: '#e8822a' },
      '&.Mui-focused fieldset': { borderColor: '#e8822a' },
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(255,255,255,0.4)',
      opacity: 1,
    },
  };

  const datePickerSlotProps = {
    textField: {
      fullWidth: true,
      required: true,
      sx: {
        backgroundColor: '#111827',
        borderRadius: 1,
        input: { color: 'white' },
        label: { color: 'rgba(255,255,255,0.7)' },
        '& label.Mui-focused': { color: '#e8822a' },
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
          '&:hover fieldset': { borderColor: '#e8822a' },
          '&.Mui-focused fieldset': { borderColor: '#e8822a' },
        },
        svg: { color: 'white' },
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 5,
        backgroundColor: '#080b14',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(30,58,95,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 4, width: '100%' }}>
          <BackButton />
        </Box>

        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            backgroundColor: '#1a2540',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            mb={4}
            color="white"
            textAlign="center"
          >
            Modifier le tournoi ✏️
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: '#e8822a' }} />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box mb={3}>
                <Typography
                  variant="body2"
                  mb={1}
                  color="rgba(255,255,255,0.7)"
                >
                  Nom du tournoi
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  size="small"
                  sx={darkInputStyle}
                />
              </Box>

              <Box mb={4}>
                <Typography
                  variant="body2"
                  mb={1}
                  color="rgba(255,255,255,0.7)"
                >
                  Description
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  sx={darkInputStyle}
                />
              </Box>

              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="fr"
              >
                <Grid container spacing={3} mb={4} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nombre max d'équipes"
                      fullWidth
                      variant="outlined"
                      type="number"
                      value={nombresParticipantsMax}
                      onChange={(e) =>
                        setNombresParticipantsMax(Number(e.target.value))
                      }
                      required
                      sx={{
                        ...darkInputStyle,
                        label: { color: 'rgba(255,255,255,0.7)' },
                        '& label.Mui-focused': { color: '#e8822a' },
                      }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {/* ✨ Added minDate={tomorrow} back for security */}
                    <DatePicker
                      label="Date limite d'inscription"
                      value={dateLimiteInscription}
                      onChange={(val) => setDateLimiteInscription(val)}
                      minDate={tomorrow}
                      slotProps={datePickerSlotProps}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {/* ✨ Secured to not be before deadline or tomorrow */}
                    <DatePicker
                      label="Date de début"
                      value={dateDebut}
                      onChange={(val) => setDateDebut(val)}
                      minDate={dateLimiteInscription || tomorrow}
                      slotProps={datePickerSlotProps}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {/* ✨ Secured to not be before start date */}
                    <DatePicker
                      label="Date de fin"
                      value={dateFin}
                      onChange={(val) => setDateFin(val)}
                      minDate={dateDebut || dateLimiteInscription || tomorrow}
                      slotProps={datePickerSlotProps}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: '#e8822a',
                  color: 'white',
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#c86e20' },
                }}
              >
                SAUVEGARDER LES MODIFICATIONS
              </Button>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default EditTournamentPage;
