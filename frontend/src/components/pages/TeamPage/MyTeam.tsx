import { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  ExitToApp as LeaveIcon,
  EmojiEvents,
  Edit as EditIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import {
  depromoteResponsable,
  getUserTeam,
  isCurrentUserResponsable,
  leaveEquipe,
  promoteResponsable,
  updateTeamImage, // ✨ IMPORT NEW FUNCTION
} from '../../../services/teams';
import { Equipe } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';
import {
  fetchTeamRegistrationsPublic,
  TeamRegistrationItem,
} from '../../../services/tournaments';

export function MyTeam() {
  const pageBlueGradient =
    'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

  const navigate = useNavigate();
  const [team, setTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<'success' | 'error'>(
    'success',
  );
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<
    number | null
  >(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSimpleLeaveDialogOpen, setIsSimpleLeaveDialogOpen] = useState(false);
  const [replacementResponsibleId, setReplacementResponsibleId] = useState<
    number | null
  >(null);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [pendingPromoteMember, setPendingPromoteMember] = useState<{
    id: number;
    tag?: string;
  } | null>(null);
  const [teamRegistrations, setTeamRegistrations] = useState<
    TeamRegistrationItem[]
  >([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(
    null,
  );

  // ✨ NEW STATE FOR IMAGE UPDATING
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const teamImages = [
    'akatsuki.jpg',
    'espada.jpg',
    'fairytail.jpg',
    'hunter.jpg',
    'onepiece.jpg',
  ];
  const [selectedNewImage, setSelectedNewImage] = useState(teamImages[0]);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  const currentUserId = (() => {
    const token = getAuthenticatedUser()?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  const handleAuthFailure = useCallback(
    (err: unknown): boolean => {
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.includes('Session expirée') ||
        errorMessage.includes('Utilisateur non authentifié')
      ) {
        navigate('/login');
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadMyTeam = useCallback(async () => {
    setRegistrationsLoading(true);
    setRegistrationsError(null);
    try {
      const [myTeam, responsable] = await Promise.all([
        getUserTeam(),
        isCurrentUserResponsable(),
      ]);

      setTeam(myTeam);
      setIsResponsable(responsable);

      if (myTeam?.id) {
        const token = getAuthenticatedUser()?.token;
        if (token) {
          try {
            const registrations = await fetchTeamRegistrationsPublic(myTeam.id);
            setTeamRegistrations(registrations);
          } catch {
            setRegistrationsError(
              "Impossible de charger l'historique des tournois pour le moment.",
            );
            setTeamRegistrations([]);
          }
        } else {
          setTeamRegistrations([]);
        }
      } else {
        setTeamRegistrations([]);
      }
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage('Impossible de charger votre équipe pour le moment.');
      setTeamRegistrations([]);
    } finally {
      setLoading(false);
      setRegistrationsLoading(false);
    }
  }, [handleAuthFailure]);

  useEffect(() => {
    loadMyTeam();
  }, [loadMyTeam]);

  const handleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    const otherMembers = team.members.filter(
      (member) => member.id !== currentUserId,
    );
    const responsablesCount = team.members.filter(
      (member) => member.isResponsable,
    ).length;
    const mustChooseReplacement = isResponsable && responsablesCount === 1;

    if (mustChooseReplacement && otherMembers.length > 0) {
      setReplacementResponsibleId(null);
      setIsLeaveDialogOpen(true);
      return;
    }

    setIsSimpleLeaveDialogOpen(true);
  };

  const handleConfirmSimpleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    try {
      await leaveEquipe();
      setTeam(null);
      setIsResponsable(false);
      setIsSimpleLeaveDialogOpen(false);
      setMessageSeverity('success');
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
      );
    }
  };

  const handleConfirmLeaveTeam = async () => {
    if (!team) {
      return;
    }

    if (!replacementResponsibleId) {
      setMessageSeverity('error');
      setMessage('Vous devez choisir un nouveau responsable avant de quitter.');
      return;
    }

    try {
      await leaveEquipe(undefined, replacementResponsibleId);
      setTeam(null);
      setIsResponsable(false);
      setIsLeaveDialogOpen(false);
      setReplacementResponsibleId(null);
      setMessageSeverity('success');
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
      );
    }
  };

  const handlePromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await promoteResponsable(memberId);
      await loadMyTeam();
      setMessageSeverity('success');
      setMessage(`${memberTag || 'Le membre'} est maintenant responsable.`);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de nommer ce membre responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const openPromoteConfirm = (memberId: number, memberTag?: string) => {
    setPendingPromoteMember({ id: memberId, tag: memberTag });
    setPromoteConfirmOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!pendingPromoteMember) {
      return;
    }
    setPromoteConfirmOpen(false);
    await handlePromote(pendingPromoteMember.id, pendingPromoteMember.tag);
    setPendingPromoteMember(null);
  };

  const handleDepromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await depromoteResponsable(memberId);
      await loadMyTeam();
      setMessageSeverity('success');
      setMessage(`${memberTag || 'Le membre'} n'est plus responsable.`);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessageSeverity('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de retirer ce responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const handleUpdateImage = async () => {
    if (!team) return;
    setIsUpdatingImage(true);
    try {
      await updateTeamImage(team.id, selectedNewImage);
      await loadMyTeam();
      setIsImageDialogOpen(false);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) return;
      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de l'image.",
      );
    } finally {
      setIsUpdatingImage(false);
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
          background: pageBlueGradient,
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageBlueGradient,
          p: 3,
        }}
      >
        <Alert severity="info">Vous n&apos;êtes dans aucune équipe.</Alert>
      </Box>
    );
  }

  const otherMembers = team.members.filter(
    (member) => member.id !== currentUserId,
  );
  const responsablesCount = team.members.filter(
    (member) => member.isResponsable,
  ).length;
  const canPromoteMore = responsablesCount < 2;
  const sortedMembers = [...team.members].sort((a, b) => {
    const aResponsable = a.isResponsable ? 1 : 0;
    const bResponsable = b.isResponsable ? 1 : 0;
    if (aResponsable !== bResponsable) {
      return bResponsable - aResponsable;
    }

    const aTag = (a.tag || '').trim();
    const bTag = (b.tag || '').trim();
    const byTag = aTag.localeCompare(bTag, 'fr', {
      sensitivity: 'base',
    });
    if (byTag !== 0) {
      return byTag;
    }

    return (a.id || 0) - (b.id || 0);
  });

  const parseTournamentDate = (date?: string): number => {
    if (!date) return Number.MAX_SAFE_INTEGER;
    const timestamp = Date.parse(date);
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  };

  const normalizeState = (etat?: string): string => (etat || '').toUpperCase();

  const registrationsSorted = [...teamRegistrations].sort((a, b) => {
    const aDate = parseTournamentDate(a.tournoi?.dateDebut);
    const bDate = parseTournamentDate(b.tournoi?.dateDebut);
    return aDate - bDate;
  });

  const upcomingRegistrations = registrationsSorted.filter((registration) => {
    const etat = normalizeState(registration.tournoi?.etat);
    return etat === 'OUVERT' || etat === 'CLOTURE' || etat === 'BROUILLON';
  });

  const inProgressRegistrations = registrationsSorted.filter(
    (registration) => normalizeState(registration.tournoi?.etat) === 'EN_COURS',
  );

  const pastRegistrations = registrationsSorted
    .filter((registration) => {
      const etat = normalizeState(registration.tournoi?.etat);
      return etat === 'TERMINE';
    })
    .sort(
      (a, b) =>
        parseTournamentDate(b.tournoi?.dateDebut) -
        parseTournamentDate(a.tournoi?.dateDebut),
    );

  const formatDate = (value?: string) => {
    if (!value) return 'Date non définie';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const statusLabel: Record<string, string> = {
    BROUILLON: 'Brouillon',
    OUVERT: 'À venir',
    CLOTURE: 'À venir',
    EN_COURS: 'En cours',
    TERMINE: 'Passé',
    ANNULE: 'Annulé',
  };

  const statusColor: Record<string, string> = {
    BROUILLON: '#64748b',
    OUVERT: '#3b82f6',
    CLOTURE: '#0ea5e9',
    EN_COURS: '#f59e0b',
    TERMINE: '#10b981',
    ANNULE: '#ef4444',
  };

  const renderRegistrationSection = (
    title: string,
    registrations: TeamRegistrationItem[],
    emptyMessage: string,
    accentColor: string,
  ) => (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${accentColor}`,
        background:
          'linear-gradient(120deg, rgba(8,11,20,0.75), rgba(26,37,64,0.55))',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="white">
          {title}
        </Typography>
        <Chip
          label={registrations.length}
          size="small"
          sx={{ bgcolor: accentColor, color: 'white', fontWeight: 700 }}
        />
      </Stack>

      <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />

      {registrations.length === 0 ? (
        <Typography variant="body2" color="rgba(255,255,255,0.75)">
          {emptyMessage}
        </Typography>
      ) : (
        <List disablePadding>
          {registrations.map((registration, index) => {
            const tournamentState = normalizeState(registration.tournoi?.etat);
            return (
              <Box
                key={`${registration.tournoiId}-${registration.equipeId}-${index}`}
              >
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 1,
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.06)',
                    },
                  }}
                  onClick={() =>
                    navigate(`/tournois/${registration.tournoiId}`)
                  }
                >
                  <Box>
                    <Typography fontWeight={700} color="white">
                      {registration.tournoi?.nom || 'Tournoi sans nom'}
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.75)">
                      Début: {formatDate(registration.tournoi?.dateDebut)}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      statusLabel[tournamentState] ||
                      tournamentState ||
                      'Inconnu'
                    }
                    size="small"
                    sx={{
                      bgcolor: statusColor[tournamentState] || '#334155',
                      color: 'white',
                      fontWeight: 700,
                    }}
                  />
                </ListItem>
                {index < registrations.length - 1 && <Divider />}
              </Box>
            );
          })}
        </List>
      )}
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        background: pageBlueGradient,
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        {message && (
          <Alert severity={messageSeverity} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* 1. HEADER BANNER */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 2,
            bgcolor: '#1a2540',
            color: 'white',
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 📸 TEAM IMAGE AND EDIT BUTTON */}
            <Box sx={{ position: 'relative' }}>
              {team.profileImage && (
                <Avatar
                  src={`/${team.profileImage}`}
                  alt={team.name}
                  variant="rounded"
                  sx={{
                    width: 90,
                    height: 90,
                    border: '3px solid #e8822a',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                />
              )}
              {isResponsable && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setIsImageDialogOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#1a2540',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: 'auto',
                    p: 0.5,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#e8822a' },
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
            </Box>

            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Membre de l'équipe
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {team.name}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupsIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">
                    {team.members.length} Membres
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5}>
            {isResponsable && (
              <>
                <Button
                  variant="contained"
                  onClick={() => navigate('/equipes/demande')}
                  sx={{
                    bgcolor: '#e8822a',
                    color: 'white',
                    '&:hover': { bgcolor: '#c86e20' },
                  }}
                >
                  Demandes d'adhésion
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EmojiEvents />}
                  onClick={() => navigate('/tournois/gestion')}
                  sx={{
                    bgcolor: '#22c55e',
                    color: 'white',
                    '&:hover': { bgcolor: '#16a34a' },
                  }}
                >
                  Gérer les Tournois
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<LeaveIcon />}
              onClick={handleLeaveTeam}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { bgcolor: '#c86e20', borderColor: '#c86e20' },
              }}
            >
              Quitter l'équipe
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box
            role="list"
            aria-label="team-members-list"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {sortedMembers.map((member) => (
              <Paper
                key={member.id}
                role="listitem"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: '#1a2540',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: member.isResponsable
                      ? '#e8822a'
                      : 'rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(26, 37, 64, 0.8)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  },
                }}
              >
                <Avatar
                  src={member.profileImageUrl || member.profileImage}
                  alt={member.tag}
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 1.5,
                    border: '3px solid rgba(255,255,255,0.15)',
                    transition: 'transform 0.3s ease',
                  }}
                />

                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="white"
                  sx={{
                    mb: 0.5,
                  }}
                >
                  {member.tag}
                </Typography>

                {member.id === currentUserId && (
                  <Chip
                    label="Moi"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(59,130,246,0.16)',
                      color: '#93c5fd',
                      fontWeight: 700,
                      mb: 1,
                    }}
                  />
                )}

                <Chip
                  label={
                    member.specialty
                      ? member.specialty.charAt(0).toUpperCase() +
                        member.specialty.slice(1)
                      : 'Membre'
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: 11,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.25)',
                    mb: 1,
                  }}
                />

                <Chip
                  label={member.isResponsable ? 'Responsable' : 'Membre'}
                  size="small"
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: member.isResponsable ? '#e8822a' : '#334155',
                    color: 'white',
                    mt: 1.5,
                    mb: 2,
                  }}
                />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/players/${member.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontSize: 11,
                    width: '100%',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.35)',
                    mb: 1,
                    '&:hover': {
                      bgcolor: '#080b14',
                      borderColor: '#c86e20',
                    },
                  }}
                >
                  Voir details
                </Button>

                {isResponsable &&
                  member.id !== currentUserId &&
                  (member.isResponsable || canPromoteMore) && (
                    <Button
                      size="small"
                      variant={member.isResponsable ? 'outlined' : 'contained'}
                      disabled={memberActionLoadingId === member.id}
                      onClick={() => {
                        const targetMemberId = member.id;
                        if (typeof targetMemberId !== 'number') {
                          return;
                        }

                        if (member.isResponsable) {
                          handleDepromote(targetMemberId, member.tag);
                        } else {
                          openPromoteConfirm(targetMemberId, member.tag);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: 11,
                        width: '100%',
                        bgcolor: member.isResponsable
                          ? 'transparent'
                          : '#e8822a',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.35)',
                        '&:hover': {
                          bgcolor: member.isResponsable ? '#080b14' : '#c86e20',
                          borderColor: '#c86e20',
                        },
                      }}
                    >
                      {member.isResponsable
                        ? 'Retirer le rôle de responsable'
                        : 'Nommer responsable'}
                    </Button>
                  )}
              </Paper>
            ))}
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#1a2540',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              color="white"
            >
              Historique des tournois
            </Typography>

            {registrationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress color="secondary" size={24} />
              </Box>
            ) : registrationsError ? (
              <Alert severity="warning">{registrationsError}</Alert>
            ) : (
              <>
                {renderRegistrationSection(
                  'Tournois en cours',
                  inProgressRegistrations,
                  'Aucun tournoi en cours actuellement.',
                  '#f59e0b',
                )}

                {renderRegistrationSection(
                  'Tournois à venir',
                  upcomingRegistrations,
                  "Aucun tournoi à venir pour l'instant.",
                  '#3b82f6',
                )}

                {renderRegistrationSection(
                  'Tournois passés',
                  pastRegistrations,
                  'Aucun tournoi passé pour le moment.',
                  '#10b981',
                )}
              </>
            )}
          </Paper>
        </Box>
      </Container>

      {/* ✨ DIALOG FOR UPDATING THE TEAM IMAGE ✨ */}
      <Dialog
        open={isImageDialogOpen}
        onClose={() => !isUpdatingImage && setIsImageDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}
        >
          Modifier l'emblème de l'équipe
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mt: 2,
            }}
          >
            {teamImages.map((img) => (
              <Box
                key={img}
                component="img"
                src={`/${img}`}
                alt={`Emblème ${img}`}
                onClick={() => setSelectedNewImage(img)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border:
                    selectedNewImage === img
                      ? '3px solid #e8822a'
                      : '3px solid transparent',
                  opacity: selectedNewImage === img ? 1 : 0.5,
                  transition: 'all 0.2s ease-in-out',
                  objectFit: 'cover',
                  '&:hover': { transform: 'scale(1.1)', opacity: 1 },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mt: 2, pb: 2 }}>
          <Button
            onClick={() => setIsImageDialogOpen(false)}
            disabled={isUpdatingImage}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              mr: 2,
              '&:hover': { bgcolor: '#080b14' },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateImage}
            disabled={isUpdatingImage || selectedNewImage === team.profileImage}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isUpdatingImage ? 'Modification...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSimpleLeaveDialogOpen}
        onClose={() => setIsSimpleLeaveDialogOpen(false)}
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
          Quitter l&apos;équipe
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Êtes-vous sûr de vouloir quitter {team.name} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsSimpleLeaveDialogOpen(false)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              '&:hover': {
                bgcolor: '#080b14',
                borderColor: '#c86e20',
              },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSimpleLeaveTeam}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
          >
            Quitter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Choisir un nouveau responsable
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Avant de quitter l'equipe, vous devez designer un autre responsable.
          </Typography>
          <RadioGroup
            value={replacementResponsibleId?.toString() || ''}
            onChange={(event) =>
              setReplacementResponsibleId(Number(event.target.value))
            }
          >
            {otherMembers.map((member) => (
              <FormControlLabel
                key={member.id}
                value={member.id?.toString() || ''}
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      '&.Mui-checked': { color: '#e8822a' },
                    }}
                  />
                }
                label={`${member.tag} (${member.specialty ? member.specialty.charAt(0).toUpperCase() + member.specialty.slice(1) : 'Membre'})`}
                sx={{ color: 'white' }}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsLeaveDialogOpen(false)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              '&:hover': {
                bgcolor: '#080b14',
                borderColor: '#c86e20',
              },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmLeaveTeam}
            disabled={!replacementResponsibleId}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promoteConfirmOpen}
        onClose={() => {
          setPromoteConfirmOpen(false);
          setPendingPromoteMember(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmer la promotion</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment nommer{' '}
            <strong>{pendingPromoteMember?.tag || 'ce membre'}</strong>{' '}
            responsable ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPromoteConfirmOpen(false);
              setPendingPromoteMember(null);
            }}
          >
            Annuler
          </Button>
          <Button variant="contained" onClick={handleConfirmPromote}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
