import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../BackButton';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  EmojiEvents,
  AddCircleOutline,
  ArrowForward,
  Stadium,
  CheckCircle,
  History,
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import {
  fetchAcceptedTournamentRegistrations,
  fetchPublicTournaments,
  fetchTeamRegistrations,
  registerTeamToTournament,
  TeamRegistrationItem,
} from '../../../../services/tournaments';
import { getUserTeam } from '../../../../services/teams';
import { getAuthenticatedUser } from '../../../../utils/session';

interface Tournoi {
  id: number;
  nom: string;
  etat: string;
  dateDebut: string;
  nombresParticipantsMax?: number;
}

interface Inscription {
  tournoiId: number;
  equipeId: number;
  dateInscription?: string;
  tournoi: Tournoi;
}

const toInscriptions = (
  registrations: TeamRegistrationItem[],
  tournamentsById: Map<number, Tournoi>,
): Inscription[] => {
  return registrations.reduce<Inscription[]>((acc, item) => {
    const tournoi = item.tournoi ?? tournamentsById.get(item.tournoiId);
    if (!tournoi) return acc;

    acc.push({
      tournoiId: item.tournoiId,
      equipeId: item.equipeId,
      dateInscription: item.dateInscription,
      tournoi,
    });

    return acc;
  }, []);
};

const formatDate = (dateValue: string) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('fr-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusChip = (etat: string) => {
  const open = etat === 'OUVERT';
  return (
    <Chip
      label={open ? 'Ouvert' : etat}
      size="small"
      sx={{
        height: 26,
        borderRadius: 999,
        bgcolor: open ? 'rgba(34,197,94,0.14)' : 'rgba(249,115,22,0.14)',
        color: open ? '#86efac' : '#fdba74',
        border: open
          ? '1px solid rgba(34,197,94,0.22)'
          : '1px solid rgba(249,115,22,0.20)',
        fontWeight: 800,
        fontSize: '0.72rem',
      }}
    />
  );
};

const isClosedEtat = (etat?: string) => {
  const normalized = (etat || '').toUpperCase();
  return (
    normalized === 'CLOTURE' ||
    normalized === 'CLOTURÉ' ||
    normalized === 'TERMINE' ||
    normalized === 'TERMINÉ'
  );
};

const isTerminatedEtat = (etat?: string) => {
  const normalized = (etat || '').toUpperCase();
  return normalized === 'TERMINE' || normalized === 'TERMINÉ';
};

type StatusFilter = 'ALL' | 'EN_COURS' | 'OUVERT' | 'TERMINE' | 'CLOTURE';

const normalizeEtat = (etat?: string) => (etat || '').toUpperCase();

const matchesStatusFilter = (etat: string, filter: StatusFilter) => {
  const normalized = normalizeEtat(etat);

  if (filter === 'ALL') return true;
  if (filter === 'EN_COURS') return normalized === 'EN_COURS';
  if (filter === 'OUVERT') return normalized === 'OUVERT';
  if (filter === 'TERMINE') return isTerminatedEtat(normalized);
  if (filter === 'CLOTURE') {
    return normalized === 'CLOTURE' || normalized === 'CLOTURÉ';
  }

  return true;
};

export function TournoisResponsable() {
  const navigate = useNavigate();
  const token = getAuthenticatedUser()?.token;

  const [equipeId, setEquipeId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('Votre équipe');
  const [mesInscriptions, setMesInscriptions] = useState<Inscription[]>([]);
  const [tournoisOuverts, setTournoisOuverts] = useState<Tournoi[]>([]);
  const [tournoisClotures, setTournoisClotures] = useState<Tournoi[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [tournoiCible, setTournoiCible] = useState<Tournoi | null>(null);
  const [registerWarningMessage, setRegisterWarningMessage] = useState<
    string | null
  >(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      setPageLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      setPageLoading(true);

      const [allTournaments, myTeam] = await Promise.all([
        fetchPublicTournaments(),
        getUserTeam(),
      ]);

      if (!myTeam) {
        setMesInscriptions([]);
        setTournoisOuverts([]);
        setTournoisClotures([]);
        setTeamName('Votre équipe');
        setEquipeId(null);
        return;
      }

      setTeamName(myTeam.name);
      setEquipeId(myTeam.id);

      const inscriptionsRaw = await fetchTeamRegistrations(myTeam.id, token);
      const tournamentsById = new Map<number, Tournoi>(
        (allTournaments as Tournoi[]).map((t) => [t.id, t]),
      );

      const inscriptions = toInscriptions(inscriptionsRaw, tournamentsById);
      setMesInscriptions(inscriptions);

      const mesTournoisIds = new Set(inscriptions.map((i) => i.tournoi.id));
      const ouverts: Tournoi[] = [];
      const clotures: Tournoi[] = [];

      for (const t of allTournaments as Tournoi[]) {
        const etat = (t.etat || '').toUpperCase();
        if (etat === 'OUVERT' && !mesTournoisIds.has(t.id)) ouverts.push(t);
        if (isClosedEtat(etat)) clotures.push(t);
      }

      setTournoisOuverts(ouverts);
      setTournoisClotures(clotures);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erreur de chargement.',
      );
    } finally {
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async () => {
    if (!tournoiCible || !equipeId || !token) return;

    try {
      setErrorMessage(null);
      setFeedback(null);
      setActionLoading(tournoiCible.id);

      await registerTeamToTournament(tournoiCible.id, equipeId, token);

      setFeedback(`Inscription réussie au tournoi : ${tournoiCible.nom} !`);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur d'inscription.",
      );
    } finally {
      setActionLoading(null);
      setIsRegisterModalOpen(false);
      setTournoiCible(null);
    }
  };

  const renderTournoiCard = (
    tournoi: Tournoi,
    actionButton: ReactNode,
    variant: 'joined' | 'open' | 'closed',
  ) => {
    const isJoined = variant === 'joined';
    const isOpen = variant === 'open';

    return (
      <Card
        key={tournoi.id}
        onClick={() => navigate(`/tournois/${tournoi.id}`)}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          borderRadius: 4,
          border: '1px solid',
          borderColor: isJoined
            ? 'rgba(34,197,94,0.18)'
            : isOpen
              ? 'rgba(232,130,42,0.18)'
              : 'rgba(255,255,255,0.08)',
          bgcolor: 'rgba(17,24,39,0.72)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.20)',
          transition:
            'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: isJoined
              ? 'rgba(34,197,94,0.35)'
              : isOpen
                ? 'rgba(232,130,42,0.35)'
                : 'rgba(255,255,255,0.16)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(232,130,42,0.10), transparent 42%)',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ p: 3, position: 'relative' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr auto' },
              alignItems: 'center',
              gap: 2.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  mb: 1.1,
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: isJoined
                      ? 'rgba(34,197,94,0.14)'
                      : isOpen
                        ? 'rgba(232,130,42,0.14)'
                        : 'rgba(255,255,255,0.06)',
                    color: isJoined
                      ? '#86efac'
                      : isOpen
                        ? '#fbbf24'
                        : '#cbd5e1',
                    flexShrink: 0,
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 21 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {tournoi.nom}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    Début le {formatDate(tournoi.dateDebut)}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {statusChip(tournoi.etat)}
                <Chip
                  label={
                    isJoined
                      ? 'Déjà inscrit'
                      : isOpen
                        ? 'Inscription ouverte'
                        : 'Clôturé'
                  }
                  size="small"
                  sx={{
                    height: 26,
                    borderRadius: 999,
                    bgcolor: isJoined
                      ? 'rgba(34,197,94,0.10)'
                      : isOpen
                        ? 'rgba(232,130,42,0.10)'
                        : 'rgba(255,255,255,0.06)',
                    color: isJoined
                      ? '#86efac'
                      : isOpen
                        ? '#fdba74'
                        : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                  }}
                />
              </Stack>
            </Box>

            <Box
              onClick={(event) => event.stopPropagation()}
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center',
              }}
            >
              {actionButton}
            </Box>
          </Box>

          <Box
            sx={{
              mt: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <ArrowForward sx={{ fontSize: 18 }} />
            <Typography
              variant="caption"
              sx={{ letterSpacing: '0.03em', textTransform: 'uppercase' }}
            >
              Ouvrir le détail du tournoi
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const stats = useMemo(
    () => [
      { label: 'Inscrits', value: mesInscriptions.length, icon: CheckCircle },
      { label: 'Ouverts', value: tournoisOuverts.length, icon: Stadium },
      { label: 'Clôturés', value: tournoisClotures.length, icon: History },
    ],
    [mesInscriptions.length, tournoisOuverts.length, tournoisClotures.length],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const mesTournoisIds = useMemo(
    () => new Set(mesInscriptions.map((inscription) => inscription.tournoi.id)),
    [mesInscriptions],
  );

  const filteredMesInscriptions = useMemo(
    () =>
      mesInscriptions.filter(
        (inscription) =>
          !isClosedEtat(inscription.tournoi.etat) &&
          matchesStatusFilter(inscription.tournoi.etat, statusFilter) &&
          inscription.tournoi.nom.toLowerCase().includes(normalizedSearch),
      ),
    [mesInscriptions, normalizedSearch, statusFilter],
  );

  const filteredTournoisOuverts = useMemo(
    () =>
      tournoisOuverts.filter(
        (tournoi) =>
          matchesStatusFilter(tournoi.etat, statusFilter) &&
          tournoi.nom.toLowerCase().includes(normalizedSearch),
      ),
    [tournoisOuverts, normalizedSearch, statusFilter],
  );

  const filteredTournoisClotures = useMemo(
    () =>
      tournoisClotures.filter(
        (tournoi) =>
          matchesStatusFilter(tournoi.etat, statusFilter) &&
          tournoi.nom.toLowerCase().includes(normalizedSearch),
      ),
    [tournoisClotures, normalizedSearch, statusFilter],
  );

  const sortedFilteredTournoisClotures = useMemo(
    () =>
      [...filteredTournoisClotures].sort((a, b) => {
        const aParticipating = mesTournoisIds.has(a.id);
        const bParticipating = mesTournoisIds.has(b.id);
        const aTerminated = isTerminatedEtat(a.etat);
        const bTerminated = isTerminatedEtat(b.etat);

        const aRank = aTerminated
          ? aParticipating
            ? 2
            : 3
          : aParticipating
            ? 0
            : 1;
        const bRank = bTerminated
          ? bParticipating
            ? 2
            : 3
          : bParticipating
            ? 0
            : 1;

        if (aRank !== bRank) return aRank - bRank;
        return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
      }),
    [filteredTournoisClotures, mesTournoisIds],
  );

  const hasSearch = normalizedSearch !== '';

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: { xs: 3, md: 5 },
        background:
          'radial-gradient(circle at top, rgba(232,130,42,0.12), transparent 28%), linear-gradient(180deg, #0b1020 0%, #0d1426 100%)',
      }}
    >
      <Container maxWidth="xl">
        {feedback && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {feedback}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            bgcolor: 'rgba(17,24,39,0.72)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top right, rgba(232,130,42,0.12), transparent 35%)',
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <BackButton
              sx={{
                position: 'absolute',
                top: 8,
                left: 0,
                zIndex: 2,
              }}
            />
            <Box
              sx={{
                pt: 3,
                pr: { xs: 0, md: 10 },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.5fr 0.9fr' },
                gap: 3,
                alignItems: 'stretch',
              }}
            >
              <Box>
                <Chip
                  label="Gestion responsable"
                  sx={{
                    mb: 1.5,
                    bgcolor: 'rgba(232,130,42,0.14)',
                    color: '#fdba74',
                    border: '1px solid rgba(232,130,42,0.18)',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={`Team : ${teamName}`}
                  sx={{
                    mb: 1.5,
                    ml: 1,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.82)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontWeight: 700,
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    color: 'white',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                  }}
                >
                  Tournois de votre équipe
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1.2,
                    color: 'rgba(255,255,255,0.68)',
                    maxWidth: 720,
                  }}
                >
                  Inscrivez votre équipe aux tournois ouverts et suivez
                  l’historique de vos participations depuis un seul écran.
                </Typography>

                <TextField
                  fullWidth
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un tournoi"
                  size="small"
                  sx={{
                    mt: 3,
                    maxWidth: 520,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.04)',
                      color: 'white',
                      borderRadius: 999,
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.10)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(232,130,42,0.45)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#e8822a',
                      },
                    },
                    '& input': {
                      py: 1.4,
                      color: 'white',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#e8822a' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl
                  size="small"
                  sx={{
                    mt: 2,
                    maxWidth: 280,
                    minWidth: 220,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.04)',
                      color: 'white',
                      borderRadius: 999,
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.10)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(232,130,42,0.45)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#e8822a',
                      },
                    },
                  }}
                >
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Filtre statut
                  </InputLabel>
                  <Select
                    label="Filtre statut"
                    value={statusFilter}
                    onChange={(event: SelectChangeEvent<StatusFilter>) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                  >
                    <MenuItem value="ALL">Tous</MenuItem>
                    <MenuItem value="EN_COURS">En cours</MenuItem>
                    <MenuItem value="OUVERT">Inscription ouverte</MenuItem>
                    <MenuItem value="TERMINE">Terminé</MenuItem>
                    <MenuItem value="CLOTURE">Clôturé</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1.5,
                }}
              >
                {stats.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Paper
                      key={s.label}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        minHeight: 116,
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          bgcolor: 'rgba(232,130,42,0.12)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fdba74',
                          mb: 1.2,
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {s.label}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: 'white', fontWeight: 900, mt: 0.4 }}
                      >
                        {s.value}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Paper>

        {pageLoading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(17,24,39,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', mb: 1 }}>
              Chargement des tournois...
            </Typography>
            <LinearProgress
              sx={{
                height: 7,
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': { bgcolor: '#e8822a' },
              }}
            />
          </Paper>
        )}

        {!pageLoading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: '1.15fr 1fr 1fr' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}
              >
                <CheckCircle sx={{ color: '#86efac' }} />
                <Typography
                  variant="h5"
                  sx={{ color: 'white', fontWeight: 800 }}
                >
                  Mes inscriptions
                </Typography>
              </Box>

              {filteredMesInscriptions.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(17,24,39,0.72)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Votre équipe n&apos;a aucune inscription active pour le
                    moment.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {filteredMesInscriptions.map((inscription) =>
                    renderTournoiCard(
                      inscription.tournoi,
                      <Chip
                        label="Inscription confirmée"
                        sx={{
                          bgcolor: 'rgba(34,197,94,0.16)',
                          color: '#86efac',
                          fontWeight: 800,
                          border: '1px solid rgba(34,197,94,0.18)',
                          px: 0.5,
                        }}
                      />,
                      'joined',
                    ),
                  )}
                </Stack>
              )}
            </Box>

            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}
              >
                <Stadium sx={{ color: '#fdba74' }} />
                <Typography
                  variant="h5"
                  sx={{ color: 'white', fontWeight: 800 }}
                >
                  Tournois ouverts
                </Typography>
              </Box>

              {tournoisOuverts.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(17,24,39,0.72)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Aucun nouveau tournoi n&apos;est ouvert aux inscriptions.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {filteredTournoisOuverts.map((tournoi) =>
                    renderTournoiCard(
                      tournoi,
                      <Button
                        variant="contained"
                        disableElevation
                        startIcon={<AddCircleOutline />}
                        disabled={actionLoading === tournoi.id}
                        onClick={() => {
                          setTournoiCible(tournoi);
                          setRegisterWarningMessage(null);

                          if (tournoi.nombresParticipantsMax) {
                            fetchAcceptedTournamentRegistrations(tournoi.id)
                              .then((accepted) => {
                                const remainingSlots =
                                  tournoi.nombresParticipantsMax! -
                                  accepted.length;
                                if (remainingSlots <= 1) {
                                  setRegisterWarningMessage(null);
                                } else {
                                  setRegisterWarningMessage(null);
                                }
                              })
                              .catch(() => {
                                setRegisterWarningMessage(
                                  'Attention : si le tournoi devient plein, il sera clôturé automatiquement.',
                                );
                              });
                          } else {
                            setRegisterWarningMessage(
                              'Attention : cette inscription peut impacter le statut du tournoi.',
                            );
                          }

                          setIsRegisterModalOpen(true);
                        }}
                        sx={{
                          borderRadius: 999,
                          px: 2.2,
                          py: 1.1,
                          textTransform: 'none',
                          fontWeight: 800,
                          bgcolor: '#e8822a',
                          color: 'white',
                          minWidth: 150,
                          '&:hover': { bgcolor: '#cf6f12' },
                        }}
                      >
                        S&apos;inscrire
                      </Button>,
                      'open',
                    ),
                  )}
                </Stack>
              )}
            </Box>

            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}
              >
                <History sx={{ color: '#cbd5e1' }} />
                <Typography
                  variant="h5"
                  sx={{ color: 'white', fontWeight: 800 }}
                >
                  Clôturés
                </Typography>
              </Box>

              {tournoisClotures.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(17,24,39,0.72)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Aucun tournoi clôturé disponible.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {sortedFilteredTournoisClotures.map((tournoi) => {
                    const isParticipating = mesTournoisIds.has(tournoi.id);
                    const isTerminated = isTerminatedEtat(tournoi.etat);

                    const chipLabel = isParticipating
                      ? 'Equipe inscrite'
                      : isTerminated
                        ? 'Terminé'
                        : 'Inscriptions fermées';

                    const chipBgColor = isParticipating
                      ? 'rgba(34,197,94,0.16)'
                      : isTerminated
                        ? 'rgba(148,163,184,0.15)'
                        : 'rgba(255,255,255,0.08)';

                    const chipTextColor = isParticipating
                      ? '#86efac'
                      : isTerminated
                        ? '#cbd5e1'
                        : '#e2e8f0';

                    const chipBorder = isParticipating
                      ? '1px solid rgba(34,197,94,0.18)'
                      : isTerminated
                        ? '1px solid rgba(148,163,184,0.28)'
                        : '1px solid rgba(255,255,255,0.08)';

                    return renderTournoiCard(
                      tournoi,
                      <Chip
                        label={chipLabel}
                        sx={{
                          bgcolor: chipBgColor,
                          color: chipTextColor,
                          fontWeight: 800,
                          border: chipBorder,
                          px: 0.5,
                        }}
                      />,
                      'closed',
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        )}

        {!pageLoading &&
          hasSearch &&
          filteredMesInscriptions.length === 0 &&
          filteredTournoisOuverts.length === 0 &&
          sortedFilteredTournoisClotures.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(17,24,39,0.72)',
                border: '1px solid rgba(255,255,255,0.08)',
                mt: 3,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Aucun tournoi trouvé pour cette recherche.
              </Typography>
            </Paper>
          )}
      </Container>

      <Dialog
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Confirmer l&apos;inscription
        </DialogTitle>

        <DialogContent sx={{ color: 'white', pt: 2.5 }}>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.72)' }}>
            Voulez-vous inscrire votre équipe au tournoi{' '}
            <strong>{tournoiCible?.nom}</strong> ?
          </DialogContentText>

          {registerWarningMessage && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {registerWarningMessage}
            </Alert>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.2,
            bgcolor: 'rgba(255,255,255,0.03)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Button
            onClick={() => setIsRegisterModalOpen(false)}
            sx={{
              color: 'rgba(255,255,255,0.72)',
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Retour
          </Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              borderRadius: 999,
              px: 2.2,
              textTransform: 'none',
              fontWeight: 800,
              '&:hover': { bgcolor: '#cf6f12' },
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
