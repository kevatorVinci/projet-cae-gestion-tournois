import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
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
  TextField,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

import BackButton from '../../BackButton';
import {
  fetchAllTournaments,
  fetchTournamentMatchesAdmin,
  generateTournamentSchedule,
  publishTournamentSchedule,
  publishTournament,
} from '../../../services/tournaments';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType, Tournoi } from '../../../types';
import { Match } from '../../../types';
import AdminMatchManagement from '../Match/AdminMatchManagement';

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
    accent: '#dc2626',
    chipBg: 'rgba(220,38,38,0.20)',
    chipText: '#f87171',
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

const AdminTournamentsPage = () => {
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<'tournaments' | 'matches'>(
    'tournaments',
  );

  const [tournaments, setTournaments] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: ReactNode;
  } | null>(null);
  const [planningGeneratedByTournament, setPlanningGeneratedByTournament] =
    useState<Record<number, boolean>>({});
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTournaments = useCallback(async () => {
    if (!authenticatedUser?.token) return;

    try {
      setLoading(true);
      setError(null);

      const data: Tournoi[] = await fetchAllTournaments(
        authenticatedUser.token,
      );
      setTournaments(data);

      try {
        const candidates = data.filter(
          (tournament: Tournoi) =>
            tournament.etat === 'CLOTURE' || tournament.etat === 'EN_COURS',
        );

        const entries = await Promise.all(
          candidates.map(async (tournament: Tournoi) => {
            if (tournament.planningMatchPublie) {
              return [tournament.id, true] as const;
            }

            try {
              const adminMatches = await fetchTournamentMatchesAdmin(
                tournament.id,
                authenticatedUser.token,
              );
              return [tournament.id, adminMatches.length > 0] as const;
            } catch {
              return [tournament.id, false] as const;
            }
          }),
        );

        setPlanningGeneratedByTournament(Object.fromEntries(entries));
      } catch {
        setPlanningGeneratedByTournament({});
      }
    } catch {
      setError('Impossible de charger les tournois.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedUser?.token]);

  const loadAllMatches = useCallback(async () => {
    if (!authenticatedUser?.token) return;

    try {
      const activeTournaments = tournaments.filter(
        (t) => t.etat === 'EN_COURS' || t.etat === 'CLOTURE',
      );

      let matchesAcc: Match[] = [];

      for (const t of activeTournaments) {
        try {
          const tMatches = (await fetchTournamentMatchesAdmin(
            t.id,
            authenticatedUser.token,
          )) as unknown as Match[];

          matchesAcc = [...matchesAcc, ...tMatches];
        } catch {
          // ignore une erreur sur un tournoi spécifique
        }
      }

      setAllMatches(matchesAcc);
    } catch (err) {
      console.error('Erreur lors du chargement des matchs', err);
    }
  }, [authenticatedUser?.token, tournaments]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (activeView === 'matches') {
      loadAllMatches();
    }
  }, [activeView, loadAllMatches]);

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
    } catch {
      setActionMessage({
        type: 'error',
        text: 'Erreur lors de la publication du tournoi. Vérifiez votre connexion.',
      });
    }
  };

  const handleGeneratePlanning = async (id: number) => {
    if (!authenticatedUser?.token) return;

    setActionMessage(null);

    try {
      await generateTournamentSchedule(id, authenticatedUser.token);
      navigate(`/tournois/${id}/matchs`);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la génération du planning.',
      });
    }
  };

  const handlePublishPlanning = async (id: number) => {
    if (!authenticatedUser?.token) return;

    setActionMessage(null);

    const tournamentName =
      tournaments.find((tournament) => tournament.id === id)?.nom ||
      `Tournoi #${id}`;

    try {
      await publishTournamentSchedule(id, authenticatedUser.token);
      setActionMessage({
        type: 'success',
        text: (
          <>
            Le planning du tournoi <strong>{tournamentName}</strong> a ete
            publie : il est visible pour tous les joueurs.
          </>
        ),
      });
      await loadTournaments();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la publication du planning.',
      });
    }
  };

  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString('fr-BE');
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as string);
  };

  const filteredTournaments = tournaments.filter((t) => {
    const normalizedSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      t.nom.toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) return false;

    if (filter === 'Tous') return true;
    if (filter === 'En attente de publication') return t.etat === 'BROUILLON';
    if (filter === 'À venir') return t.etat === 'OUVERT';
    if (filter === 'Clôturés') return t.etat === 'CLOTURE';
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
        background: 'transparent',
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
            Gestion des Tournois
          </Typography>

          <Typography variant="h6" color="text.secondary" mb={3}>
            Espace administrateur : création de tournois et encodage des
            résultats.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                backgroundColor: '#0d1525',
                borderRadius: '18px',
                p: 0.5,
                border: '1px solid rgba(255,255,255,0.08)',
                gap: 0.5,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {[
                {
                  value: 'tournaments',
                  label: 'Tournois',
                  icon: <EmojiEventsIcon sx={{ fontSize: 18 }} />,
                },
                {
                  value: 'matches',
                  label: 'Matchs en cours',
                  icon: <SportsEsportsIcon sx={{ fontSize: 18 }} />,
                },
              ].map(({ value, label, icon }) => (
                <Box
                  key={value}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onClick={() =>
                    setActiveView(value as 'tournaments' | 'matches')
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveView(value as 'tournaments' | 'matches');
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2.5,
                    py: 1,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    color:
                      activeView === value ? 'white' : 'rgba(255,255,255,0.45)',
                    background:
                      activeView === value
                        ? 'linear-gradient(180deg, #ffa33d 0%, #e8822a 100%)'
                        : 'transparent',
                    boxShadow:
                      activeView === value
                        ? '0 2px 10px rgba(232,130,42,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : 'none',
                    userSelect: 'none',
                    '&:hover': {
                      color:
                        activeView === value
                          ? 'white'
                          : 'rgba(255,255,255,0.75)',
                      background:
                        activeView === value
                          ? 'linear-gradient(180deg, #ffa33d 0%, #e8822a 100%)'
                          : 'rgba(255,255,255,0.06)',
                    },
                  }}
                >
                  {icon}
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'inherit',
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {actionMessage && (
          <Alert severity={actionMessage.type} sx={{ mb: 4 }}>
            {actionMessage.text}
          </Alert>
        )}

        {activeView === 'tournaments' && (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 3,
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: '300px' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/tournaments/create')}
                  sx={{
                    backgroundColor: '#e8822a',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#c86e20' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Créer un tournoi
                </Button>

                <TextField
                  placeholder="Rechercher un tournoi..."
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    backgroundColor: '#111827',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#e8822a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#e8822a',
                      },
                    },
                  }}
                />
              </Box>

              <FormControl
                variant="outlined"
                size="small"
                sx={{ minWidth: 250 }}
              >
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
              Liste des tournois ({sortedTournaments.length})
            </Typography>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e8822a' }} />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && sortedTournaments.length === 0 && (
              <Typography color="text.secondary">
                Aucun tournoi ne correspond à ce filtre.
              </Typography>
            )}

            {!loading &&
              !error &&
              sortedTournaments.map((tournament) => {
                const etatStyle = ETAT_STYLES[tournament.etat];
                const hasGeneratedPlanning =
                  planningGeneratedByTournament[tournament.id] ||
                  tournament.planningMatchPublie;

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

                      {(tournament.etat === 'CLOTURE' ||
                        tournament.etat === 'EN_COURS') && (
                        <Box
                          sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {!hasGeneratedPlanning && (
                            <Button
                              variant="contained"
                              onClick={() =>
                                handleGeneratePlanning(tournament.id)
                              }
                              sx={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: 'bold',
                                '&:hover': { backgroundColor: '#2563eb' },
                              }}
                            >
                              Générer planning
                            </Button>
                          )}

                          {hasGeneratedPlanning &&
                            !tournament.planningMatchPublie && (
                              <Button
                                variant="contained"
                                onClick={() =>
                                  handlePublishPlanning(tournament.id)
                                }
                                sx={{
                                  backgroundColor: '#7c3aed',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  '&:hover': { backgroundColor: '#6d28d9' },
                                }}
                              >
                                Publier planning
                              </Button>
                            )}

                          <Button
                            variant="outlined"
                            onClick={() =>
                              navigate(`/tournois/${tournament.id}/matchs`)
                            }
                            disabled={!hasGeneratedPlanning}
                            sx={{
                              color: '#60a5fa',
                              borderColor: '#60a5fa',
                              opacity: hasGeneratedPlanning ? 1 : 0.6,
                              '&:hover': {
                                backgroundColor: 'rgba(96,165,250,0.12)',
                              },
                            }}
                          >
                            Voir planning
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </Box>
        )}

        {activeView === 'matches' && authenticatedUser?.token && (
          <AdminMatchManagement
            matches={allMatches}
            tournaments={tournaments}
            token={authenticatedUser.token}
            onRefresh={loadAllMatches}
          />
        )}
      </Container>
    </Box>
  );
};

export default AdminTournamentsPage;