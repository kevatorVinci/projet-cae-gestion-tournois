import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Stack,
  Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BackButton from '../../BackButton';
import { Tournoi } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';
import {
  fetchTeamRegistrations,
  fetchTournamentMatches,
  registerTeamToTournament,
  TeamMatch,
} from '../../../services/tournaments';
import TournamentBracket from './TournamentBracket';
import {
  getEquipeById,
  getUserTeam,
  isCurrentUserResponsable,
} from '../../../services/teams';

type EquipeLike = {
  id?: number;
  name?: string;
  nom?: string;
  profileImage?: string;
};

type InscriptionTournoi = {
  etat?: string;
  equipeId?: number;
  equipeName?: string;
  equipeProfileImage?: string;
  equipe?: EquipeLike;
};

type TournoiDetail = Tournoi & {
  inscriptions?: InscriptionTournoi[];
};

const formatDate = (dateValue: string) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }
  return parsedDate.toLocaleDateString('fr-BE');
};

const getEtatLabel = (etat: Tournoi['etat']) => {
  switch (etat) {
    case 'OUVERT':
      return 'Ouvert';
    case 'CLOTURE':
      return 'Clôturé';
    case 'EN_COURS':
      return 'En cours';
    case 'TERMINE':
      return 'Terminé';
    case 'ANNULE':
      return 'Annulé';
    default:
      return etat;
  }
};

const getEtatColor = (etat: Tournoi['etat']) => {
  switch (etat) {
    case 'EN_COURS':
      return '#e8822a';
    case 'OUVERT':
      return '#16a34a';
    case 'CLOTURE':
      return '#dc2626';
    case 'TERMINE':
      return '#64748b';
    case 'ANNULE':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

const resolveTeamName = (inscription: InscriptionTournoi, index: number) => {
  return (
    inscription.equipeName ||
    inscription.equipe?.name ||
    inscription.equipe?.nom ||
    `Équipe inscrite #${index + 1}`
  );
};

const resolveTeamImage = (inscription: InscriptionTournoi) => {
  return inscription.equipeProfileImage || inscription.equipe?.profileImage;
};

const normalizeImageSrc = (image?: string) => {
  if (!image) {
    return undefined;
  }
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return image.startsWith('/') ? image : `/${image}`;
};

const resolveTeamId = (inscription: InscriptionTournoi) => {
  return inscription.equipeId || inscription.equipe?.id;
};

const getAvatarColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 40%)`;
};

const fetchTournoiById = async (id: string): Promise<TournoiDetail> => {
  const response = await fetch(`/api/tournois/${id}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les détails du tournoi.');
  }
  return response.json();
};

const fetchAcceptedInscriptions = async (
  id: string,
): Promise<InscriptionTournoi[]> => {
  const response = await fetch(`/api/tournois/${id}/inscriptions/accepted`, {
    headers: {},
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
};

const TournoiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [acceptedInscriptions, setAcceptedInscriptions] = useState<
    InscriptionTournoi[]
  >([]);
  const [teamImagesById, setTeamImagesById] = useState<Record<number, string>>(
    {},
  );
  const [isResponsable, setIsResponsable] = useState(false);
  const [responsableTeamId, setResponsableTeamId] = useState<number | null>(
    null,
  );
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerConfirmOpen, setRegisterConfirmOpen] = useState(false);
  const [registerFeedback, setRegisterFeedback] = useState<string | null>(null);
  const [registerFeedbackIsError, setRegisterFeedbackIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<'teams' | 'matches'>(
    'teams',
  );

  const [matches, setMatches] = useState<TeamMatch[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Identifiant du tournoi manquant.');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setRegisterFeedback(null);
        const [tournoiDetail, inscriptions] = await Promise.all([
          fetchTournoiById(id),
          fetchAcceptedInscriptions(id),
        ]);
        setTournoi(tournoiDetail);
        setAcceptedInscriptions(inscriptions);

        const tournamentMatches = await fetchTournamentMatches(id);
        setMatches(tournamentMatches);

        const token = getAuthenticatedUser()?.token;
        if (!token) {
          setIsResponsable(false);
          setResponsableTeamId(null);
          setAlreadyRegistered(false);
          return;
        }

        const responsable = await isCurrentUserResponsable();
        setIsResponsable(responsable);

        if (!responsable) {
          setResponsableTeamId(null);
          setAlreadyRegistered(false);
          return;
        }

        const myTeam = await getUserTeam();
        if (!myTeam) {
          setResponsableTeamId(null);
          setAlreadyRegistered(false);
          return;
        }

        setResponsableTeamId(myTeam.id);
        const myRegistrations = await fetchTeamRegistrations(myTeam.id, token);
        const isAlreadyRegistered = myRegistrations.some(
          (registration) => registration.tournoiId === Number(id),
        );
        setAlreadyRegistered(isAlreadyRegistered);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger ce tournoi.',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    const sourceTeams =
      acceptedInscriptions.length > 0
        ? acceptedInscriptions
        : tournoi?.inscriptions || [];

    const missingTeamIds = Array.from(
      new Set(
        sourceTeams
          .filter((inscription) => !resolveTeamImage(inscription))
          .map((inscription) => resolveTeamId(inscription))
          .filter((teamId): teamId is number => typeof teamId === 'number')
          .filter((teamId) => !teamImagesById[teamId]),
      ),
    );

    if (missingTeamIds.length === 0) {
      return;
    }

    let cancelled = false;

    const loadMissingTeamImages = async () => {
      const loadedEntries = await Promise.all(
        missingTeamIds.map(async (teamId) => {
          try {
            const equipe = await getEquipeById(teamId);
            return [teamId, equipe.profileImage || ''] as const;
          } catch {
            return [teamId, ''] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setTeamImagesById((current) => {
        const next = { ...current };
        loadedEntries.forEach(([teamId, profileImage]) => {
          if (profileImage) {
            next[teamId] = profileImage;
          }
        });
        return next;
      });
    };

    loadMissingTeamImages();

    return () => {
      cancelled = true;
    };
  }, [acceptedInscriptions, tournoi, teamImagesById]);

  const teams = useMemo(() => {
    const sourceTeams =
      acceptedInscriptions.length > 0
        ? acceptedInscriptions
        : tournoi?.inscriptions || [];

    return [...sourceTeams].sort((a, b) => {
      const nameA = resolveTeamName(a, 0);
      const nameB = resolveTeamName(b, 0);
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });
  }, [acceptedInscriptions, tournoi]);

  const handleDirectRegister = async () => {
    if (!id || !responsableTeamId) {
      setRegisterConfirmOpen(false);
      return;
    }

    const token = getAuthenticatedUser()?.token;
    if (!token) {
      setRegisterFeedback('Session expirée. Veuillez vous reconnecter.');
      setRegisterFeedbackIsError(true);
      setRegisterConfirmOpen(false);
      return;
    }

    try {
      setRegisterFeedback(null);
      setRegisterFeedbackIsError(false);
      setRegisterLoading(true);
      await registerTeamToTournament(id, responsableTeamId, token);
      setAlreadyRegistered(true);
      setRegisterFeedback('Votre equipe est inscrite a ce tournoi.');
      setRegisterFeedbackIsError(false);

      const [refreshedTournoi, refreshedAccepted] = await Promise.all([
        fetchTournoiById(id),
        fetchAcceptedInscriptions(id),
      ]);
      setTournoi(refreshedTournoi);
      setAcceptedInscriptions(refreshedAccepted);
    } catch (err: unknown) {
      setRegisterFeedback(
        err instanceof Error
          ? err.message
          : "Impossible d'inscrire votre equipe.",
      );
      setRegisterFeedbackIsError(true);
    } finally {
      setRegisterLoading(false);
      setRegisterConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'transparent',
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (error || !tournoi) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'transparent',
          p: 3,
        }}
      >
        <Alert severity="error">{error || 'Tournoi introuvable.'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
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
        <BackButton />

        <Card
          sx={{
            mb: 3,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={1.5}
            >
              <Typography variant="h4" fontWeight={800} color="white">
                {tournoi.nom}
              </Typography>
              <Chip
                label={getEtatLabel(tournoi.etat)}
                sx={{
                  backgroundColor: getEtatColor(tournoi.etat),
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {tournoi.description ||
                "Aucune description n'a encore été ajoutée pour ce tournoi."}
            </Typography>

            {tournoi.etat === 'TERMINE' && tournoi.gagnant && (
              <Box
                sx={{
                  mt: 3,
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <EmojiEventsIcon sx={{ color: '#eab308', fontSize: 36 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  >
                    Vainqueur
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ color: '#eab308' }}
                  >
                    {tournoi.gagnant.name}
                  </Typography>
                </Box>
              </Box>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Chip
                label={`Début: ${formatDate(tournoi.dateDebut)}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              <Chip
                label={`Fin: ${formatDate(tournoi.dateFin)}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              <Chip
                label={`Limite d'inscription: ${formatDate(
                  tournoi.dateLimiteInscription,
                )}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              {tournoi.nombresParticipantsMax && (
                <Chip
                  label={`Max équipes: ${tournoi.nombresParticipantsMax}`}
                  sx={{ bgcolor: '#1a2540', color: 'white' }}
                />
              )}
            </Stack>

            {/* ── Stats: places & inscriptions ──────────────── */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 140,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(232,130,42,0.08)',
                  border: '1px solid rgba(232,130,42,0.25)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ color: '#e8822a' }}
                >
                  {teams.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Équipe{teams.length > 1 ? 's' : ''} inscrite
                  {teams.length > 1 ? 's' : ''}
                </Typography>
              </Box>

              {tournoi.nombresParticipantsMax && (
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 140,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      tournoi.nombresParticipantsMax - teams.length > 0
                        ? 'rgba(22,163,106,0.08)'
                        : 'rgba(239,68,68,0.08)',
                    border:
                      tournoi.nombresParticipantsMax - teams.length > 0
                        ? '1px solid rgba(22,163,106,0.25)'
                        : '1px solid rgba(239,68,68,0.25)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                      color:
                        tournoi.nombresParticipantsMax - teams.length > 0
                          ? '#16a34a'
                          : '#ef4444',
                    }}
                  >
                    {tournoi.nombresParticipantsMax - teams.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Place
                    {tournoi.nombresParticipantsMax - teams.length > 1
                      ? 's'
                      : ''}{' '}
                    disponible
                    {tournoi.nombresParticipantsMax - teams.length > 1
                      ? 's'
                      : ''}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  flex: 1,
                  minWidth: 140,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor:
                    tournoi.etat === 'OUVERT'
                      ? 'rgba(22,163,106,0.08)'
                      : 'rgba(100,116,139,0.08)',
                  border:
                    tournoi.etat === 'OUVERT'
                      ? '1px solid rgba(22,163,106,0.25)'
                      : '1px solid rgba(100,116,139,0.25)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    color: tournoi.etat === 'OUVERT' ? '#16a34a' : '#64748b',
                  }}
                >
                  {tournoi.etat === 'OUVERT' ? 'Ouvertes' : 'Fermées'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inscriptions
                </Typography>
              </Box>
            </Box>

            {isResponsable && (
              <Box sx={{ mt: 3 }}>
                {registerFeedback && (
                  <Alert
                    severity={registerFeedbackIsError ? 'error' : 'success'}
                    sx={{ mb: 2 }}
                  >
                    {registerFeedback}
                  </Alert>
                )}

                {alreadyRegistered ? (
                  <Chip
                    label="Votre équipe est déjà inscrite"
                    sx={{ bgcolor: '#16a34a', color: 'white', fontWeight: 700 }}
                  />
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setRegisterConfirmOpen(true)}
                    disabled={tournoi.etat !== 'OUVERT' || registerLoading}
                    sx={{
                      bgcolor: '#16a34a',
                      color: 'white',
                      '&:hover': { bgcolor: '#15803d' },
                    }}
                  >
                    {registerLoading
                      ? 'Inscription en cours...'
                      : "S'inscrire au tournoi"}
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={registerConfirmOpen}
          onClose={() => setRegisterConfirmOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              bgcolor: '#1a2540',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.12)',
            },
          }}
        >
          <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
            Confirmer l'inscription
          </DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              Confirmez-vous l'inscription de votre équipe à ce tournoi ?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setRegisterConfirmOpen(false)}
              sx={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleDirectRegister}
              disabled={registerLoading}
              sx={{
                bgcolor: '#16a34a',
                color: 'white',
                '&:hover': { bgcolor: '#15803d' },
              }}
            >
              {registerLoading ? 'Inscription...' : 'Confirmer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Card
          sx={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent>
            <Tabs
              value={activeContentTab}
              onChange={(_, value: 'teams' | 'matches') =>
                setActiveContentTab(value)
              }
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                mb: 2,
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.72)',
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 42,
                },
                '& .Mui-selected': {
                  color: '#93c5fd !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3b82f6',
                  height: 3,
                  borderRadius: 10,
                },
              }}
            >
              <Tab
                value="teams"
                icon={<GroupsIcon fontSize="small" />}
                iconPosition="start"
                label={`Équipes (${teams.length}${
                  tournoi.nombresParticipantsMax
                    ? `/${tournoi.nombresParticipantsMax}`
                    : ''
                })`}
              />
              <Tab
                value="matches"
                icon={<CalendarMonthIcon fontSize="small" />}
                iconPosition="start"
                label={`Matchs (${matches.length})`}
              />
            </Tabs>

            {activeContentTab === 'teams' &&
              (teams.length === 0 ? (
                <>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{ mb: 1 }}
                  >
                    Équipes inscrites
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aucune équipe inscrite pour le moment.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{ mb: 1 }}
                  >
                    Équipes inscrites
                  </Typography>
                  <Stack spacing={1.5}>
                    {teams.map((inscription, index) =>
                      (() => {
                        const teamId = resolveTeamId(inscription);
                        const canNavigate = typeof teamId === 'number';
                        const teamImage =
                          resolveTeamImage(inscription) ||
                          (canNavigate ? teamImagesById[teamId] : undefined);

                        return (
                          <Box
                            key={`${resolveTeamName(inscription, index)}-${index}`}
                            onClick={() => {
                              if (!canNavigate) {
                                return;
                              }
                              navigate(`/equipes/${teamId}`);
                            }}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.5,
                              borderRadius: 1.5,
                              border: '1px solid rgba(255,255,255,0.08)',
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              cursor: canNavigate ? 'pointer' : 'default',
                              transition:
                                'border-color 0.2s ease, background-color 0.2s ease',
                              '&:hover': canNavigate
                                ? {
                                    borderColor: 'rgba(96,165,250,0.65)',
                                    backgroundColor: 'rgba(96,165,250,0.08)',
                                  }
                                : undefined,
                            }}
                          >
                            {/** Team avatar generated from team name when no team image exists. */}
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Avatar
                                src={normalizeImageSrc(teamImage)}
                                sx={{
                                  bgcolor: getAvatarColorFromName(
                                    resolveTeamName(inscription, index),
                                  ),
                                  color: 'white',
                                }}
                              >
                                {resolveTeamName(inscription, index)
                                  .charAt(0)
                                  .toUpperCase()}
                              </Avatar>
                              <Typography
                                color={canNavigate ? '#93c5fd' : 'white'}
                                fontWeight={600}
                                sx={{
                                  textDecoration: canNavigate
                                    ? 'underline'
                                    : 'none',
                                  textUnderlineOffset: canNavigate
                                    ? '2px'
                                    : undefined,
                                }}
                              >
                                {resolveTeamName(inscription, index)}
                              </Typography>
                            </Stack>
                            {inscription.etat &&
                              inscription.etat !== 'ACCEPTEE' && (
                                <Chip
                                  size="small"
                                  label={inscription.etat}
                                  sx={{ bgcolor: '#1a2540', color: 'white' }}
                                />
                              )}
                          </Box>
                        );
                      })(),
                    )}
                  </Stack>
                </>
              ))}

            {activeContentTab === 'matches' && (
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700} color="white">
                  Matchs
                </Typography>
                {!tournoi.planningMatchPublie || matches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Le planning des matchs n'est pas encore publié.
                  </Typography>
                ) : (
                  <TournamentBracket
                    matches={matches}
                    tournamentEndDate={tournoi.dateFin}
                  />
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default TournoiDetailPage;
