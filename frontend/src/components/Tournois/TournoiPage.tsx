import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Tournoi } from '../../types';
import BackButton from '../BoutonRetour';

const fetchFilteredTournaments = async (nom?: string): Promise<Tournoi[]> => {
  const params = new URLSearchParams();
  if (nom) params.append('nom', nom);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/tournois/${query}`);
  if (!response.ok) throw new Error('Failed to fetch tournaments');
  return response.json();
};

type CategoryFilter = 'TOUS' | 'EN_COURS' | 'A_VENIR' | 'PASSES';

const COLORS = {
  EN_COURS: '#e8822a',
  A_VENIR: '#3b82f6',
  PASSES: '#4b5563',
} as const;

const TournoiPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState<CategoryFilter>('TOUS');
  const [allTournaments, setAllTournaments] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue;
    }
    return parsedDate.toLocaleDateString('fr-BE');
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setError(null);
        const data = await fetchFilteredTournaments(search || undefined);
        setAllTournaments(data);
      } catch {
        setAllTournaments([]);
        setError('Impossible de charger les tournois pour le moment.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, etatFilter]);

  const tournamentsByFilter = allTournaments.filter((t) => {
    if (etatFilter === 'EN_COURS') return t.etat === 'EN_COURS';
    if (etatFilter === 'A_VENIR') {
      return t.etat === 'OUVERT' || t.etat === 'CLOTURE';
    }
    if (etatFilter === 'PASSES') return t.etat === 'TERMINE';
    return true;
  });

  const enCours = tournamentsByFilter.filter((t) => t.etat === 'EN_COURS');
  const aVenir = tournamentsByFilter.filter(
    (t) => t.etat === 'OUVERT' || t.etat === 'CLOTURE',
  );
  const passes = tournamentsByFilter.filter((t) => t.etat === 'TERMINE');

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
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
            Tournois
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Consultez les tournois en cours, à venir et terminés.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mb: 4,
            gridTemplateColumns: {
              xs: '1fr',
              md: '2fr 1fr',
            },
          }}
        >
          <TextField
            fullWidth
            label="Rechercher un tournoi"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              backgroundColor: '#111827',
              borderRadius: 2,
              '& .MuiInputBase-input': { color: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#e8822a' }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth>
            <InputLabel id="tournoi-etat-filter-label">État</InputLabel>
            <Select
              labelId="tournoi-etat-filter-label"
              value={etatFilter}
              label="État"
              onChange={(event) =>
                setEtatFilter(event.target.value as CategoryFilter)
              }
              sx={{
                backgroundColor: '#111827',
                color: 'white',
              }}
            >
              <MenuItem value="TOUS">Tous</MenuItem>
              <MenuItem value="EN_COURS">En cours</MenuItem>
              <MenuItem value="A_VENIR">À venir</MenuItem>
              <MenuItem value="PASSES">Passés</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e8822a' }} />
          </Box>
        ) : etatFilter === 'TOUS' ? (
          /* ── Vue 3 colonnes (filtre TOUS) ────────────────────────── */
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            <Box>
              <Typography variant="h6" gutterBottom color="white">
                Tournois en cours
              </Typography>
              {enCours.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi en cours.
                </Typography>
              )}
              {enCours.map((tournament) => (
                <Card
                  key={tournament.id}
                  sx={{
                    cursor: 'pointer',
                    mb: 2,
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: `3px solid ${COLORS.EN_COURS}`,
                  }}
                  onClick={() => navigate(`/tournois/${tournament.id}`)}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="white"
                    >
                      {tournament.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Du {formatDate(tournament.dateDebut)} au{' '}
                      {formatDate(tournament.dateFin)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom color="white">
                Tournois à venir
              </Typography>
              {aVenir.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi à venir.
                </Typography>
              )}
              {aVenir.map((tournament) => (
                <Card
                  key={tournament.id}
                  sx={{
                    cursor: 'pointer',
                    mb: 2,
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: `3px solid ${COLORS.A_VENIR}`,
                  }}
                  onClick={() => navigate(`/tournois/${tournament.id}`)}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="white"
                    >
                      {tournament.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Début : {formatDate(tournament.dateDebut)}
                    </Typography>
                    {tournament.nombresParticipantsMax && (
                      <Typography variant="body2" sx={{ color: '#e8822a' }}>
                        👥 Max : {tournament.nombresParticipantsMax} équipes
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom color="white">
                Tournois passés
              </Typography>
              {passes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi passé.
                </Typography>
              )}
              {passes.map((tournament) => (
                <Card
                  key={tournament.id}
                  sx={{
                    cursor: 'pointer',
                    mb: 2,
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: `3px solid ${COLORS.PASSES}`,
                  }}
                  onClick={() => navigate(`/tournois/${tournament.id}`)}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="white"
                    >
                      {tournament.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Terminé le {formatDate(tournament.dateFin)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          /* ── Vue grille pleine largeur (filtre actif) ────────────── */
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Typography variant="h6" color="white" fontWeight={700}>
                {tournamentsByFilter.length} tournoi
                {tournamentsByFilter.length !== 1 ? 's' : ''} trouvé
                {tournamentsByFilter.length !== 1 ? 's' : ''}
              </Typography>
              <Chip
                label={
                  etatFilter === 'EN_COURS'
                    ? 'En cours'
                    : etatFilter === 'A_VENIR'
                      ? 'À venir'
                      : 'Passés'
                }
                sx={{
                  backgroundColor: `${COLORS[etatFilter as keyof typeof COLORS]}22`,
                  color: COLORS[etatFilter as keyof typeof COLORS],
                  fontWeight: 700,
                  border: `1px solid ${COLORS[etatFilter as keyof typeof COLORS]}66`,
                }}
              />
            </Box>

            {tournamentsByFilter.length === 0 ? (
              <Box
                sx={{
                  py: 10,
                  textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary" variant="h6">
                  Aucun tournoi pour ce filtre.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                }}
              >
                {tournamentsByFilter.map((tournament) => (
                  <Card
                    key={tournament.id}
                    sx={{
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `4px solid ${COLORS[etatFilter as keyof typeof COLORS]}`,
                      borderRadius: 2,
                      transition: 'transform 0.15s, border-color 0.15s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: `${COLORS[etatFilter as keyof typeof COLORS]}88`,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/tournois/${tournament.id}`)}
                      sx={{ p: 0, height: '100%' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color="white"
                            sx={{ flex: 1, mr: 1 }}
                          >
                            {tournament.nom}
                          </Typography>
                          {etatFilter === 'EN_COURS' && (
                            <Chip
                              label="LIVE"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(232,130,42,0.15)',
                                color: '#e8822a',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                border: '1px solid rgba(232,130,42,0.4)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                        {etatFilter === 'EN_COURS' && (
                          <Typography variant="body2" color="text.secondary">
                            Du {formatDate(tournament.dateDebut)} au{' '}
                            {formatDate(tournament.dateFin)}
                          </Typography>
                        )}
                        {etatFilter === 'A_VENIR' && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Début : {formatDate(tournament.dateDebut)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              Inscriptions avant le{' '}
                              {formatDate(tournament.dateLimiteInscription)}
                            </Typography>
                            {tournament.nombresParticipantsMax && (
                              <Typography
                                variant="body2"
                                sx={{ color: '#e8822a', mt: 0.5 }}
                              >
                                👥 Max : {tournament.nombresParticipantsMax}{' '}
                                équipes
                              </Typography>
                            )}
                          </>
                        )}
                        {etatFilter === 'PASSES' && (
                          <Typography variant="body2" color="text.secondary">
                            Terminé le {formatDate(tournament.dateFin)}
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TournoiPage;
