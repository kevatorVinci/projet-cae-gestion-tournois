import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

import BackButton from '../../BoutonRetour';
import {
  cancelTournamentWithReason,
  closeRegistrations,
  fetchAllTournaments,
  publishTournament,
} from '../../../services/tournois';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType, Tournoi } from '../../../types';

/**
 * Admin version of the Tournaments page.
 * Lists all tournaments, allows filtering (including 'Clôturés'), and allows navigation to create/edit pages.
 *
 * @return {JSX.Element} the admin tournament management page
 */
const AdminTournamentsPage = () => {
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();

  // Memory variables for the list, statuses, and filters
  const [tournaments, setTournaments] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Memory variable to store the selected filter
  const [filter, setFilter] = useState('Tous');

  /**
   * Function to load or reload the tournaments from the server.
   */
  const loadTournaments = useCallback(async () => {
    if (!authenticatedUser?.token) return;
    try {
      setLoading(true);
      const data = await fetchAllTournaments(authenticatedUser.token);
      setTournaments(data);
    } catch (err) {
      setError('Impossible de charger les tournois.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedUser]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  /**
   * Function to publish a tournament when the green button is clicked.
   *
   * @param {number} id - the ID of the tournament to publish
   */
  const handlePublish = async (id: number) => {
    if (!authenticatedUser?.token) return;
    setActionMessage(null);

    try {
      await publishTournament(id, authenticatedUser.token);
      setActionMessage({
        type: 'success',
        text: 'Le tournoi est maintenant publié et ouvert aux inscriptions ! 🎉',
      });
      await loadTournaments();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: 'Erreur lors de la publication du tournoi. Vérifiez votre connexion.',
      });
    }
  };

  const handleCloseRegistrations = async (id: number) => {
    if (!authenticatedUser?.token) return;
    setActionMessage(null);

    try {
      await closeRegistrations(id, authenticatedUser.token);
      setActionMessage({
        type: 'success',
        text: 'Les inscriptions du tournoi sont maintenant clôturées.',
      });
      await loadTournaments();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: 'Impossible de clôturer ce tournoi (minimum 2 équipes requises).',
      });
    }
  };

  const handleCancelTournament = async (id: number) => {
    if (!authenticatedUser?.token) return;

    const reason = window.prompt(
      "Raison d'annulation du tournoi (obligatoire):",
    );
    if (reason === null) {
      return;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setActionMessage({
        type: 'error',
        text: "Veuillez saisir une raison d'annulation.",
      });
      return;
    }

    setActionMessage(null);

    try {
      await cancelTournamentWithReason(
        id,
        authenticatedUser.token,
        trimmedReason,
      );
      setActionMessage({
        type: 'success',
        text: 'Le tournoi a été annulé.',
      });
      await loadTournaments();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: "Impossible d'annuler ce tournoi.",
      });
    }
  };

  /**
   * Formats a date string into a readable format.
   *
   * @param {string} dateValue - The date from the database
   * @return {string} The formatted date
   */
  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString('fr-BE');
  };

  /**
   * Function triggered when the user selects a new filter in the dropdown.
   *
   * @param {SelectChangeEvent} event - the dropdown change event
   */
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as string);
  };

  /**
   * We create a new list that contains ONLY the tournaments matching the filter.
   * ✨ LOGIC UPDATED: Added a specific filter for CLOTURE.
   */
  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'Tous') return true;
    if (filter === 'En attente de publication') return t.etat === 'BROUILLON';
    if (filter === 'À venir') return t.etat === 'OUVERT'; // Only open tournaments here now
    if (filter === 'Clôturés') return t.etat === 'CLOTURE'; // ✨ The new specific filter!
    if (filter === 'En cours') return t.etat === 'EN_COURS';
    if (filter === 'Passés') return t.etat === 'TERMINE' || t.etat === 'ANNULE';
    return true;
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 5,
        backgroundColor: '#080b14',
        position: 'relative',
        overflow: 'hidden',
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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 5, position: 'relative' }}>
          <BackButton />

          <Button
            variant="contained"
            onClick={() => navigate('/admin/tournaments/create')}
            sx={{
              position: { xs: 'static', md: 'absolute' },
              right: 0,
              top: 0,
              backgroundColor: '#e8822a',
              color: 'white',
              fontWeight: 'bold',
              mb: { xs: 2, md: 0 },
              '&:hover': { backgroundColor: '#c86e20' },
            }}
          >
            + Créer un tournoi
          </Button>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 800,
              mb: 1,
              color: 'white',
            }}
          >
            Gestion des Tournois ⚙️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Espace administrateur : création de tournois et modification des
            brouillons.
          </Typography>
        </Box>

        {actionMessage && (
          <Alert severity={actionMessage.type} sx={{ mb: 4 }}>
            {actionMessage.text}
          </Alert>
        )}

        <Box sx={{ mt: 4 }}>
          {/* The Dropdown Filter Box */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 250 }}>
              <InputLabel
                id="filter-label"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': { color: '#e8822a' },
                }}
              >
                État
              </InputLabel>
              <Select
                labelId="filter-label"
                value={filter}
                onChange={handleFilterChange}
                label="État"
                sx={{
                  color: 'white',
                  backgroundColor: '#111827',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e8822a',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e8822a',
                  },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { backgroundColor: '#1a2540', color: 'white' },
                  },
                }}
              >
                <MenuItem value="Tous">Tous</MenuItem>
                <MenuItem value="En attente de publication">
                  En attente de publication
                </MenuItem>
                <MenuItem value="À venir">À venir</MenuItem>
                {/* ✨ The new option in the menu! */}
                <MenuItem value="Clôturés">Clôturés</MenuItem>
                <MenuItem value="En cours">En cours</MenuItem>
                <MenuItem value="Passés">Passés</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography
            variant="h5"
            color="white"
            mb={3}
            borderBottom="2px solid #2a3b55"
            pb={1}
          >
            Liste des tournois ({filteredTournaments.length}) 🗂️
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#e8822a' }} />
            </Box>
          )}
          {error && <Typography color="error">{error}</Typography>}
          {!loading && !error && filteredTournaments.length === 0 && (
            <Typography color="text.secondary">
              Aucun tournoi ne correspond à ce filtre.
            </Typography>
          )}

          {!loading &&
            !error &&
            filteredTournaments.map((tournament) => (
              <Card
                key={tournament.id}
                onClick={() => navigate(`/tournois/${tournament.id}`)}
                sx={{
                  mb: 2,
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft:
                    tournament.etat === 'BROUILLON'
                      ? '4px solid #6b7280'
                      : '4px solid #e8822a',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#e8822a',
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" color="white" fontWeight={700}>
                      {tournament.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Du {formatDate(tournament.dateDebut)} au{' '}
                      {formatDate(tournament.dateFin)}
                    </Typography>

                    <Chip
                      label={
                        tournament.etat === 'BROUILLON'
                          ? 'En attente de publication'
                          : tournament.etat
                      }
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor:
                          tournament.etat === 'BROUILLON'
                            ? '#4b5563'
                            : 'rgba(232, 130, 42, 0.2)',
                        color:
                          tournament.etat === 'BROUILLON' ? 'white' : '#e8822a',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>

                  {tournament.etat === 'BROUILLON' && (
                    <Box
                      sx={{ display: 'flex', gap: 2 }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate(`/admin/tournaments/edit/${tournament.id}`)
                        }
                        sx={{
                          color: '#e8822a',
                          borderColor: '#e8822a',
                          '&:hover': {
                            backgroundColor: 'rgba(232, 130, 42, 0.1)',
                          },
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handlePublish(tournament.id)}
                        sx={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontWeight: 'bold',
                          '&:hover': { backgroundColor: '#388e3c' },
                        }}
                      >
                        Publier
                      </Button>
                    </Box>
                  )}

                  {tournament.etat === 'OUVERT' && (
                    <Box
                      sx={{ display: 'flex', gap: 2 }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => handleCloseRegistrations(tournament.id)}
                        sx={{ color: 'white', fontWeight: 'bold' }}
                      >
                        Clôturer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancelTournament(tournament.id)}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Annuler
                      </Button>
                    </Box>
                  )}

                  {(tournament.etat === 'CLOTURE' ||
                    tournament.etat === 'EN_COURS') && (
                    <Box
                      sx={{ display: 'flex', gap: 2 }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancelTournament(tournament.id)}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Annuler
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
        </Box>
      </Container>
    </Box>
  );
};

export default AdminTournamentsPage;
