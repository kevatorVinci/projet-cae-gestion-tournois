import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
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
  fetchAllTournaments,
  publishTournament,
} from '../../../services/tournois';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType, Tournoi } from '../../../types';

type EtatStyle = {
  label: string;
  accent: string;
  chipBg: string;
  chipText: string;
};

const ETAT_STYLES: Record<Tournoi['etat'], EtatStyle> = {
  BROUILLON: {
    label: 'En attente de publication',
    accent: '#6b7280',
    chipBg: 'rgba(107,114,128,0.22)',
    chipText: '#e5e7eb',
  },
  OUVERT: {
    label: 'Ouvert',
    accent: '#16a34a',
    chipBg: 'rgba(22,163,74,0.20)',
    chipText: '#4ade80',
  },
  CLOTURE: {
    label: 'Clôturé',
    accent: '#0ea5e9',
    chipBg: 'rgba(14,165,233,0.20)',
    chipText: '#38bdf8',
  },
  EN_COURS: {
    label: 'En cours',
    accent: '#e8822a',
    chipBg: 'rgba(232,130,42,0.20)',
    chipText: '#f5a35c',
  },
  TERMINE: {
    label: 'Terminé',
    accent: '#64748b',
    chipBg: 'rgba(100,116,139,0.22)',
    chipText: '#cbd5e1',
  },
  ANNULE: {
    label: 'Annulé',
    accent: '#ef4444',
    chipBg: 'rgba(239,68,68,0.20)',
    chipText: '#fca5a5',
  },
};

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

  const sortedTournaments = useMemo(() => {
    const statusPriority: Record<Tournoi['etat'], number> = {
      EN_COURS: 0,
      OUVERT: 1,
      CLOTURE: 2,
      ANNULE: 3,
      BROUILLON: 4,
      TERMINE: 5,
    };

    const today = new Date();

    return [...filteredTournaments].sort((a, b) => {
      const priorityA = statusPriority[a.etat] ?? 99;
      const priorityB = statusPriority[b.etat] ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = new Date(a.dateDebut);
      const dateB = new Date(b.dateDebut);
      const distanceA = Math.abs(dateA.getTime() - today.getTime());
      const distanceB = Math.abs(dateB.getTime() - today.getTime());
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredTournaments]);

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
            Liste des tournois ({sortedTournaments.length}) 🗂️
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#e8822a' }} />
            </Box>
          )}
          {error && <Typography color="error">{error}</Typography>}
          {!loading && !error && sortedTournaments.length === 0 && (
            <Typography color="text.secondary">
              Aucun tournoi ne correspond à ce filtre.
            </Typography>
          )}

          {!loading &&
            !error &&
            sortedTournaments.map((tournament) =>
              (() => {
                const etatStyle = ETAT_STYLES[tournament.etat];

                return (
                  <Card
                    key={tournament.id}
                    onClick={() => navigate(`/tournois/${tournament.id}`)}
                    sx={{
                      mb: 2,
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `4px solid ${etatStyle.accent}`,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: etatStyle.accent,
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
                          label={etatStyle.label}
                          size="small"
                          sx={{
                            mt: 1,
                            backgroundColor: etatStyle.chipBg,
                            color: etatStyle.chipText,
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
                              navigate(
                                `/admin/tournaments/edit/${tournament.id}`,
                              )
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
                    </CardContent>
                  </Card>
                );
              })(),
            )}
        </Box>
      </Container>
    </Box>
  );
};

export default AdminTournamentsPage;
