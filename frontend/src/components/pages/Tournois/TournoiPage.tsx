import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Stack,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import History from '@mui/icons-material/History';
import GroupsIcon from '@mui/icons-material/Groups';
import { Tournoi } from '../../../types';
import BackButton from '../../BoutonRetour';

const fetchFilteredTournaments = async (nom?: string): Promise<Tournoi[]> => {
  const params = new URLSearchParams();
  if (nom) params.append('nom', nom);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/tournois/${query}`);
  if (!response.ok) throw new Error('Failed to fetch tournaments');
  return response.json();
};

type CategoryFilter = 'TOUS' | 'EN_COURS' | 'A_VENIR' | 'PASSES';

const parseCategoryFilter = (value: string | null): CategoryFilter => {
  if (
    value === 'TOUS' ||
    value === 'EN_COURS' ||
    value === 'A_VENIR' ||
    value === 'PASSES'
  ) {
    return value;
  }
  return 'TOUS';
};

const COLORS = {
  EN_COURS: '#e8822a',
  A_VENIR: '#3b82f6',
  PASSES: '#10b981',
} as const;

const TournoiPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState<CategoryFilter>(() =>
    parseCategoryFilter(searchParams.get('etat')),
  );
  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null);
  const [dateFin, setDateFin] = useState<Dayjs | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters =
    search.trim() !== '' ||
    etatFilter !== 'TOUS' ||
    dateDebut !== null ||
    dateFin !== null;

  const handleResetFilters = () => {
    setSearch('');
    setEtatFilter('TOUS');
    setDateDebut(null);
    setDateFin(null);
  };

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

  const tournamentsByFilter = allTournaments
    .filter((t) => {
      if (etatFilter === 'EN_COURS' && t.etat !== 'EN_COURS') return false;
      if (
        etatFilter === 'A_VENIR' &&
        t.etat !== 'OUVERT' &&
        t.etat !== 'CLOTURE'
      )
        return false;
      if (
        etatFilter === 'PASSES' &&
        t.etat !== 'TERMINE' &&
        t.etat !== 'ANNULE'
      )
        return false;

      if (dateDebut && t.dateDebut < dateDebut.format('YYYY-MM-DD'))
        return false;
      if (dateFin && t.dateFin > dateFin.format('YYYY-MM-DD')) return false;

      return true;
    })
    .sort((a, b) => {
      const timeA = Date.parse(a.dateDebut) || 0;
      const timeB = Date.parse(b.dateDebut) || 0;
      const now = Date.now();

      const distanceA = Math.abs(timeA - now);
      const distanceB = Math.abs(timeB - now);

      return distanceA - distanceB;
    });

  const enCours = tournamentsByFilter.filter((t) => t.etat === 'EN_COURS');
  const aVenir = tournamentsByFilter.filter(
    (t) => t.etat === 'OUVERT' || t.etat === 'CLOTURE',
  );
  const passes = tournamentsByFilter.filter(
    (t) => t.etat === 'TERMINE' || t.etat === 'ANNULE',
  );

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
              md: '2fr 1fr 1fr 1fr auto',
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

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <DatePicker
              label="Date début"
              value={dateDebut}
              onChange={(val) => setDateDebut(val)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    backgroundColor: '#111827',
                    borderRadius: 1,
                    input: { color: 'white' },
                    label: { color: 'rgba(255,255,255,0.7)' },
                    '& label.Mui-focused': { color: '#e8822a' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': { borderColor: '#e8822a' },
                      '&.Mui-focused fieldset': {
                        borderColor: '#e8822a',
                      },
                    },
                    svg: { color: 'white' },
                  },
                },
              }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <DatePicker
              label="Date fin"
              value={dateFin}
              onChange={(val) => setDateFin(val)}
              minDate={dateDebut || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    backgroundColor: '#111827',
                    borderRadius: 1,
                    input: { color: 'white' },
                    label: { color: 'rgba(255,255,255,0.7)' },
                    '& label.Mui-focused': { color: '#e8822a' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': { borderColor: '#e8822a' },
                      '&.Mui-focused fieldset': {
                        borderColor: '#e8822a',
                      },
                    },
                    svg: { color: 'white' },
                  },
                },
              }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            sx={{
              color: hasActiveFilters ? '#e8822a' : 'rgba(255,255,255,0.45)',
              borderColor: hasActiveFilters
                ? 'rgba(232,130,42,0.6)'
                : 'rgba(255,255,255,0.2)',
              height: '56px',
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: '#e8822a',
                backgroundColor: 'rgba(232,130,42,0.08)',
              },
            }}
          >
            Réinitialiser
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e8822a' }} />
          </Box>
        ) : etatFilter === 'TOUS' ? (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              alignItems: 'start',
            }}
          >
            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(59,130,246,0.12)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <SearchIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" color="white" fontWeight={800}>
                  Tournois en cours
                </Typography>
              </Box>

              {enCours.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi en cours.
                </Typography>
              )}

              <Stack spacing={2}>
                {enCours.map((tournament) => (
                  <Card
                    key={tournament.id}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `4px solid ${COLORS.EN_COURS}`,
                      borderRadius: 3,
                      transition:
                        'transform 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: `${COLORS.EN_COURS}88`,
                      },
                    }}
                    onClick={() => navigate(`/tournois/${tournament.id}`)}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="white"
                            sx={{ mb: 0.5 }}
                          >
                            {tournament.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Du {formatDate(tournament.dateDebut)} au{' '}
                            {formatDate(tournament.dateFin)}
                          </Typography>
                        </Box>

                        <Chip
                          label="En cours"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(59,130,246,0.12)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59,130,246,0.25)',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(232,130,42,0.12)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#e8822a',
                  }}
                >
                  <AddCircleOutline sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" color="white" fontWeight={800}>
                  Tournois à venir
                </Typography>
              </Box>

              {aVenir.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi à venir.
                </Typography>
              )}

              <Stack spacing={2}>
                {aVenir.map((tournament) => (
                  <Card
                    key={tournament.id}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `4px solid ${COLORS.A_VENIR}`,
                      borderRadius: 3,
                      transition:
                        'transform 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: `${COLORS.A_VENIR}88`,
                      },
                    }}
                    onClick={() => navigate(`/tournois/${tournament.id}`)}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="white"
                            sx={{ mb: 0.5 }}
                          >
                            {tournament.nom}
                          </Typography>
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
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#e8822a',
                                mt: 0.5,
                              }}
                            >
                              <GroupsIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">
                                Max : {tournament.nombresParticipantsMax}{' '}
                                équipes
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Chip
                          label="À venir"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(232,130,42,0.12)',
                            color: '#e8822a',
                            border: '1px solid rgba(232,130,42,0.25)',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(16,185,129,0.12)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#10b981',
                  }}
                >
                  <History sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" color="white" fontWeight={800}>
                  Tournois passés
                </Typography>
              </Box>

              {passes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucun tournoi passé.
                </Typography>
              )}

              <Stack spacing={2}>
                {passes.map((tournament) => (
                  <Card
                    key={tournament.id}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `4px solid ${COLORS.PASSES}`,
                      borderRadius: 3,
                      transition:
                        'transform 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: `${COLORS.PASSES}88`,
                      },
                    }}
                    onClick={() => navigate(`/tournois/${tournament.id}`)}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="white"
                            sx={{ mb: 0.5 }}
                          >
                            {tournament.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {tournament.etat === 'ANNULE'
                              ? `Annulé le ${formatDate(tournament.dateFin)}`
                              : `Terminé le ${formatDate(tournament.dateFin)}`}
                          </Typography>
                        </Box>

                        <Chip
                          label={
                            tournament.etat === 'ANNULE' ? 'Annulé' : 'Terminé'
                          }
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16,185,129,0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.25)',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="h6" color="white" fontWeight={800}>
                {tournamentsByFilter.length} tournoi
                {tournamentsByFilter.length !== 1 ? 's' : ''} trouvé
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
                    lg: 'repeat(3, 1fr)',
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
                      borderRadius: 3,
                      transition: 'transform 0.15s, border-color 0.15s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: `${COLORS[etatFilter as keyof typeof COLORS]}88`,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/tournois/${tournament.id}`)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={800}
                              color="white"
                              sx={{ mb: 0.5 }}
                            >
                              {tournament.nom}
                            </Typography>

                            {etatFilter === 'EN_COURS' && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Du {formatDate(tournament.dateDebut)} au{' '}
                                {formatDate(tournament.dateFin)}
                              </Typography>
                            )}

                            {etatFilter === 'A_VENIR' && (
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      color: '#e8822a',
                                      mt: 0.5,
                                    }}
                                  >
                                    <GroupsIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2">
                                      Max : {tournament.nombresParticipantsMax}{' '}
                                      équipes
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )}

                            {etatFilter === 'PASSES' && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {tournament.etat === 'ANNULE'
                                  ? `Annulé le ${formatDate(tournament.dateFin)}`
                                  : `Terminé le ${formatDate(tournament.dateFin)}`}
                              </Typography>
                            )}
                          </Box>

                          <Chip
                            label={
                              etatFilter === 'EN_COURS'
                                ? 'En cours'
                                : etatFilter === 'A_VENIR'
                                  ? 'À venir'
                                  : tournament.etat === 'ANNULE'
                                    ? 'Annulé'
                                    : 'Terminé'
                            }
                            size="small"
                            sx={{
                              bgcolor: `${COLORS[etatFilter as keyof typeof COLORS]}22`,
                              color: COLORS[etatFilter as keyof typeof COLORS],
                              border: `1px solid ${COLORS[etatFilter as keyof typeof COLORS]}66`,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
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
