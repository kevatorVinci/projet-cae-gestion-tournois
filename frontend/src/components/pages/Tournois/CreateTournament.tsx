import { useState, FormEvent, useContext } from 'react';
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
import BackButton from '../../BoutonRetour';
import {
  createTournament,
  NewTournamentPayload,
  publishTournament,
} from '../../../services/tournois';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

/**
 * Page dedicated to the creation of a new tournament.
 * Connects to the real backend using the admin token from UserContext.
 *
 * @return {JSX.Element} the tournament creation page
 */
const CreateTournamentPage = () => {
  const navigate = useNavigate();

  // ✨ NEW: We get the logged-in user from the context to have the right token
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [nombresParticipantsMax, setNombresParticipantsMax] = useState<
    number | ''
  >('');

  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null);
  const [dateFin, setDateFin] = useState<Dayjs | null>(null);
  const [dateLimiteInscription, setDateLimiteInscription] =
    useState<Dayjs | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The date of tomorrow to block past dates
  const tomorrow = dayjs().add(1, 'day');

  const validatePayload = (): NewTournamentPayload | null => {
    setError('');
    setSuccess('');

    // 1. Check if all dates are filled
    if (!dateDebut || !dateFin || !dateLimiteInscription) {
      setError('Veuillez remplir toutes les dates du calendrier.');
      return null;
    }

    // 2. SECURITY: Start date must be after or equal to the deadline
    if (dateDebut.isBefore(dateLimiteInscription, 'day')) {
      setError(
        "La date de début du tournoi doit être après la date limite d'inscription.",
      );
      return null;
    }

    // 3. SECURITY: End date must be after or equal to start date
    if (dateFin.isBefore(dateDebut, 'day')) {
      setError(
        'La date de fin ne peut pas être avant la date de début du tournoi.',
      );
      return null;
    }

    // ✨ CORRECTION: We take the token from authenticatedUser, not from localStorage!
    const token = authenticatedUser?.token;
    if (!token) {
      setError("Vous devez être connecté en tant qu'administrateur.");
      return null;
    }

    return {
      nom,
      description,
      dateDebut: dateDebut.format('YYYY-MM-DD'),
      dateFin: dateFin.format('YYYY-MM-DD'),
      dateLimiteInscription: dateLimiteInscription.format('YYYY-MM-DD'),
      nombresParticipantsMax: Number(nombresParticipantsMax),
    };
  };

  const handleCreateTournament = async (mode: 'save' | 'publish') => {
    const payload = validatePayload();
    if (!payload) {
      return;
    }

    const token = authenticatedUser?.token;
    if (!token) {
      setError("Vous devez être connecté en tant qu'administrateur.");
      return;
    }

    try {
      setIsSubmitting(true);
      const createdTournament = await createTournament(payload, token);

      if (mode === 'publish') {
        const createdId = createdTournament?.id;
        if (typeof createdId !== 'number') {
          throw new Error('ID tournoi manquant après création.');
        }
        await publishTournament(createdId, token);
        setSuccess('Le tournoi a été créé et publié avec succès !');
      } else {
        setSuccess('Le tournoi a été sauvegardé en brouillon avec succès !');
      }

      // Redirect after 2 seconds
      setTimeout(() => navigate('/admin/tournaments'), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du tournoi. Vérifiez la console.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCreateTournament('save');
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
        background: 'transparent',
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
                Nom du tournoi
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
                Description
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Règles spécifiques, récompenses..."
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                sx={darkInputStyle}
              />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
              <Grid container spacing={3} mb={4} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de début"
                    value={dateDebut}
                    onChange={(val) => setDateDebut(val)}
                    minDate={dateLimiteInscription || tomorrow}
                    slotProps={datePickerSlotProps}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de fin"
                    value={dateFin}
                    onChange={(val) => setDateFin(val)}
                    minDate={dateDebut || undefined}
                    slotProps={datePickerSlotProps}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  {/* ✨ Removed the extra * in the label since required adds it automatically */}
                  <TextField
                    label="Nombre de places"
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
                    inputProps={{ min: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date limite d'inscription"
                    value={dateLimiteInscription}
                    onChange={(val) => setDateLimiteInscription(val)}
                    minDate={tomorrow}
                    slotProps={datePickerSlotProps}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              <Button
                type="submit"
                variant="outlined"
                disabled={isSubmitting}
                sx={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  color: 'white',
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  '&:hover': {
                    borderColor: '#93c5fd',
                    backgroundColor: 'rgba(147,197,253,0.12)',
                  },
                }}
              >
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder le tournoi'}
              </Button>

              <Button
                type="button"
                variant="contained"
                disabled={isSubmitting}
                onClick={() => {
                  void handleCreateTournament('publish');
                }}
                sx={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  '&:hover': { backgroundColor: '#15803d' },
                }}
              >
                {isSubmitting ? 'Publication...' : 'Publier le tournoi'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateTournamentPage;
