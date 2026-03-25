import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import BackButton from '../BoutonRetour';
import {
  createTournament,
  NewTournamentPayload,
} from '../../services/tournois';

/**
 * Page dedicated to the creation of a new tournament.
 * Uses Material UI DatePickers to select dates, styled like the Availability page.
 *
 * @return {JSX.Element} the tournament creation page
 */
const CreateTournamentPage = () => {
  const navigate = useNavigate();

  // Memory variables for text fields
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [nombresParticipantsMax, setNombresParticipantsMax] = useState<
    number | ''
  >('');

  // ✨ NEW: Memory variables for dates using Dayjs (like in your profile)
  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null);
  const [dateFin, setDateFin] = useState<Dayjs | null>(null);
  const [dateLimiteInscription, setDateLimiteInscription] =
    useState<Dayjs | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✨ NEW: Calculate tomorrow's date to block today and the past in the calendar
  const tomorrow = dayjs().add(1, 'day');

  /**
   * Function called when the admin clicks the submit button.
   *
   * @param {FormEvent} e - the form submission event
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Verification: ensure all dates are selected
    if (!dateDebut || !dateFin || !dateLimiteInscription) {
      setError('Veuillez remplir toutes les dates du calendrier.');
      return;
    }

    // Verification: start date must be before end date
    if (dateDebut.isAfter(dateFin)) {
      setError('La date de fin ne peut pas être avant la date de début.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Vous devez être connecté en tant qu'administrateur.");
      return;
    }

    // We transform the Dayjs dates back into simple text ("YYYY-MM-DD") for the database
    const payload: NewTournamentPayload = {
      nom,
      description,
      dateDebut: dateDebut.format('YYYY-MM-DD'),
      dateFin: dateFin.format('YYYY-MM-DD'),
      dateLimiteInscription: dateLimiteInscription.format('YYYY-MM-DD'),
      nombresParticipantsMax: Number(nombresParticipantsMax),
    };

    try {
      await createTournament(payload, token);
      setSuccess('Le tournoi a été créé avec succès !');
      // Redirect to the tournaments list after success
      setTimeout(() => navigate('/admin/tournaments'), 2000);
    } catch (err) {
      setError('Erreur lors de la création du tournoi.');
    }
  };

  // Custom style for the normal dark text inputs
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

  // ✨ NEW: Custom style for the DatePickers (inspired by your DisponibilitesPage)
  const datePickerSlotProps = {
    textField: {
      fullWidth: true,
      required: true,
      sx: {
        backgroundColor: '#111827',
        borderRadius: 1,
        input: { color: 'white' },
        label: { color: '#e8822a' }, // Orange label
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
          '&:hover fieldset': { borderColor: '#e8822a' },
          '&.Mui-focused fieldset': { borderColor: '#e8822a' },
        },
        // Makes the little calendar icon white instead of grey/black
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
      {/* Background radial gradient */}
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

        {/* The Dark Centered Form Box */}
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
            Créer un tournoi
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

          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography variant="body2" mb={1} color="rgba(255,255,255,0.7)">
                Nom du tournoi *
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ex: Vinci Winter Cup 2026"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                size="small"
                sx={darkInputStyle}
              />
            </Box>

            <Box mb={4}>
              <Typography variant="body2" mb={1} color="rgba(255,255,255,0.7)">
                Description *
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Règles spécifiques, récompenses, format..."
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                sx={darkInputStyle}
              />
            </Box>

            {/* ✨ NEW: We wrap the calendar part in LocalizationProvider */}
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
              <Grid container spacing={3} mb={4} alignItems="center">
                {/* Max Teams Input */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre max d'équipes *"
                    fullWidth
                    variant="outlined"
                    type="number"
                    placeholder="Ex: 16"
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

                {/* Registration Deadline Picker */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date limite d'inscription *"
                    value={dateLimiteInscription}
                    onChange={(val: Dayjs | null) =>
                      setDateLimiteInscription(val)
                    }
                    minDate={tomorrow}
                    slotProps={datePickerSlotProps}
                  />
                </Grid>

                {/* Start Date Picker */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de début *"
                    value={dateDebut}
                    onChange={(val: Dayjs | null) => setDateDebut(val)}
                    minDate={tomorrow} // Blocks past & today
                    slotProps={datePickerSlotProps}
                  />
                </Grid>

                {/* End Date Picker */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de fin *"
                    value={dateFin}
                    onChange={(val: Dayjs | null) => setDateFin(val)}
                    minDate={dateDebut || tomorrow} // End date cannot be before start date
                    slotProps={datePickerSlotProps}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Orange Submit Button */}
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
              CRÉER LE TOURNOI
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateTournamentPage;
