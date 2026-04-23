import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  AddCircleOutline as CreateIcon,
  GroupAdd as JoinIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsMartialArts as SportsMartialArtsIcon,
} from '@mui/icons-material';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType } from '../../../types';
import { getUserTeam } from '../../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
  TeamMatch,
} from '../../../services/tournaments';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';
import BackButton from '../../BackButton';

const Profile = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState<Equipe | null>(null);
  const [memberMatches, setMemberMatches] = useState<TeamMatch[]>([]);
  const [participatedTournaments, setParticipatedTournaments] = useState<
    { id: number; nom: string; etat?: string; dateDebut?: string }[]
  >([]);
  const [participationsLoading, setParticipationsLoading] = useState(true);
  const [participationsError, setParticipationsError] = useState<string | null>(
    null,
  );

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  useEffect(() => {
    const loadProfileParticipation = async () => {
      setParticipationsLoading(true);
      setParticipationsError(null);

      let currentTeam: Equipe | null = null;

      try {
        currentTeam = await getUserTeam();
        setTeam(currentTeam);
        setHasTeam(!!currentTeam);
      } catch {
        setTeam(null);
        setHasTeam(false);
      }

      const resolvedUserId = (() => {
        const directId = (authenticatedUser as { id?: number } | undefined)?.id;
        if (typeof directId === 'number' && Number.isFinite(directId)) {
          return directId;
        }

        const token = authenticatedUser?.token || getAuthenticatedUser()?.token;
        if (!token) return null;

        const payload = decodeJwtPayload(token);
        const candidateId =
          typeof payload?.id === 'number'
            ? payload.id
            : typeof payload?.userId === 'number'
              ? payload.userId
              : Number(payload?.sub);

        return Number.isFinite(candidateId) ? candidateId : null;
      })();

      if (resolvedUserId == null) {
        setMemberMatches([]);
        setParticipatedTournaments([]);
        setParticipationsLoading(false);
        return;
      }

      try {
        const matches = await fetchMemberMatches(resolvedUserId);
        const finishedMatches = matches
          .filter((match) => {
            const normalizedStatus = (match.status ?? '').toLowerCase();
            const hasScore =
              typeof match.scoreTeam1 === 'number' &&
              typeof match.scoreTeam2 === 'number';
            return (
              hasScore ||
              normalizedStatus === 'termine' ||
              normalizedStatus === 'finished' ||
              normalizedStatus === 'completed' ||
              normalizedStatus === 'complete'
            );
          })
          .sort((left, right) => {
            const leftDate = left.scheduledDateTime
              ? new Date(left.scheduledDateTime).getTime()
              : 0;
            const rightDate = right.scheduledDateTime
              ? new Date(right.scheduledDateTime).getTime()
              : 0;
            return rightDate - leftDate;
          });

        setMemberMatches(finishedMatches);

        const uniqueTournamentIds = [
          ...new Set(finishedMatches.map((match) => match.tournamentId)),
        ];
        const tournaments = await Promise.all(
          uniqueTournamentIds.map(async (tournamentId) => {
            try {
              return await fetchTournamentById(tournamentId);
            } catch {
              return null;
            }
          }),
        );

        setParticipatedTournaments(
          tournaments.filter(
            (
              tournament,
            ): tournament is {
              id: number;
              nom: string;
              etat?: string;
              dateDebut?: string;
            } => tournament !== null,
          ),
        );
      } catch {
        setMemberMatches([]);
        setParticipatedTournaments([]);
        setParticipationsError(
          'Impossible de charger vos tournois et matchs pour le moment.',
        );
      } finally {
        setParticipationsLoading(false);
      }
    };

    loadProfileParticipation();
  }, [authenticatedUser]);

  const userTag = authenticatedUser?.tag || 'Joueur';
  const rawSpecialty = authenticatedUser?.specialty || '';
  const userRole = rawSpecialty
    ? rawSpecialty.charAt(0).toUpperCase() + rawSpecialty.slice(1)
    : 'Rôle non défini';
  const userEmail = authenticatedUser?.email || 'Email non disponible';
  const userAvatar =
    normalizeAvatarUrl(authenticatedUser?.profileImage) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userTag}`;

  const formatDate = (value?: string) => {
    if (!value) return 'Date non définie';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'Date non définie';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const sortedParticipatedTournaments = [...participatedTournaments].sort(
    (left, right) => {
      const leftDate = left.dateDebut ? new Date(left.dateDebut).getTime() : 0;
      const rightDate = right.dateDebut
        ? new Date(right.dateDebut).getTime()
        : 0;
      return rightDate - leftDate;
    },
  );

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(30,58,95,0.45), transparent)',
          pointerEvents: 'none',
        }}
      />
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.035,
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            x="0"
            y="0"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* 1. WELCOME BANNER */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background:
              'linear-gradient(135deg, rgba(17,43,79,0.9) 0%, rgba(26,37,64,0.9) 100%)',
            border: '1px solid rgba(44,90,142,0.35)',
            color: 'white',
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <BackButton />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bonjour {userTag} 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
            {hasTeam
              ? "Vous faites partie d'une équipe. Accédez à votre espace d'équipe pour gérer les membres et suivre votre progression !"
              : "Bienvenue sur votre espace personnel. Il semble que vous ne fassiez partie d'aucune équipe pour le moment. Pour participer aux tournois, rejoignez une escouade ou fondez la vôtre !"}
          </Typography>
        </Paper>

        {/* 2. PROFILE CARD */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={userAvatar}
              imgProps={{
                onError: (event) => {
                  event.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userTag}`;
                },
              }}
              sx={{ width: 80, height: 80, border: '2px solid #e8822a' }}
            />
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {userTag}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userRole}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Équipe : {team?.name || "Pas d'équipe"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/disponibilites')}
              sx={{
                backgroundColor: '#e8822a',
                color: 'white',
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Mes indisponibilités
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/profile')}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: '#e8822a',
                  color: '#e8822a',
                  backgroundColor: 'rgba(232,130,42,0.08)',
                },
              }}
            >
              Modifier le profil
            </Button>
          </Stack>
        </Paper>

        {/* ── Tournois & Matchs (Design from MemberDetails) ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Tournois */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}
            >
              <EmojiEventsIcon sx={{ color: '#e8822a', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={700} color="white">
                Tournois participés
              </Typography>
            </Box>

            {participationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e8822a' }} />
              </Box>
            ) : participationsError ? (
              <Alert severity="warning">{participationsError}</Alert>
            ) : sortedParticipatedTournaments.length === 0 ? (
              <Typography variant="body2" color="rgba(255,255,255,0.4)">
                Aucun tournoi pour le moment.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {sortedParticipatedTournaments.map((tournament) => {
                  const etat = tournament.etat;
                  const chipColor =
                    etat === 'EN_COURS'
                      ? '#e8822a'
                      : etat === 'TERMINE'
                        ? '#10b981'
                        : etat === 'ANNULE'
                          ? '#ef4444'
                          : '#3b82f6';

                  const etatLabel =
                    etat === 'EN_COURS'
                      ? 'En cours'
                      : etat === 'TERMINE'
                        ? 'Terminé'
                        : etat === 'ANNULE'
                          ? 'Annulé'
                          : etat === 'CLOTURE'
                            ? 'Clôturé'
                            : 'Ouvert';

                  return (
                    <Box
                      key={tournament.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/tournois/${tournament.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/tournois/${tournament.id}`);
                        }
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.07)',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        transition: 'border-color 0.2s, transform 0.2s',
                        '&:hover': {
                          borderColor: chipColor,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="white"
                        >
                          {tournament.nom}
                        </Typography>
                        {tournament.dateDebut && (
                          <Typography
                            variant="caption"
                            color="rgba(255,255,255,0.45)"
                          >
                            {formatDate(tournament.dateDebut)}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={etatLabel}
                        size="small"
                        sx={{
                          bgcolor: `${chipColor}22`,
                          color: chipColor,
                          fontWeight: 700,
                          fontSize: 10,
                          border: `1px solid ${chipColor}44`,
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* Matchs */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}
            >
              <SportsMartialArtsIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={700} color="white">
                Historique des matchs
              </Typography>
            </Box>

            {participationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e8822a' }} />
              </Box>
            ) : memberMatches.length === 0 ? (
              <Typography variant="body2" color="rgba(255,255,255,0.4)">
                Aucun match joué pour le moment.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {memberMatches.map((match) => {
                  const isTeam1 =
                    team?.id != null && match.team1Id === team?.id;
                  const isTeam2 =
                    team?.id != null && match.team2Id === team?.id;

                  const matchTitle = isTeam1
                    ? `vs ${match.team2Name ?? '?'}`
                    : isTeam2
                      ? `vs ${match.team1Name ?? '?'}`
                      : `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;

                  const tournamentObj = participatedTournaments.find(
                    (t) => t.id === match.tournamentId,
                  );
                  const tournamentName =
                    tournamentObj?.nom ?? `Tournoi #${match.tournamentId}`;

                  const hasScore =
                    typeof match.scoreTeam1 === 'number' &&
                    typeof match.scoreTeam2 === 'number';

                  let scoreLabel = 'Score indisponible';
                  if (hasScore) {
                    const score1 = Number(match.scoreTeam1);
                    const score2 = Number(match.scoreTeam2);
                    scoreLabel = isTeam1
                      ? `${score1} - ${score2}`
                      : isTeam2
                        ? `${score2} - ${score1}`
                        : `${score1} - ${score2}`;
                  }

                  let outcomeLabel = 'Résultat indisponible';
                  let outcomeColor = '#94a3b8';
                  let outcomeBackground = 'rgba(148,163,184,0.20)';
                  let outcomeBorder = '1px solid rgba(148,163,184,0.35)';

                  if (hasScore && (isTeam1 || isTeam2)) {
                    const score1 = Number(match.scoreTeam1);
                    const score2 = Number(match.scoreTeam2);
                    const myScore = isTeam1 ? score1 : score2;
                    const opponentScore = isTeam1 ? score2 : score1;

                    if (myScore > opponentScore) {
                      outcomeLabel = 'Victoire';
                      outcomeColor = '#34d399';
                      outcomeBackground = 'rgba(16,185,129,0.20)';
                      outcomeBorder = '1px solid rgba(16,185,129,0.35)';
                    } else if (myScore < opponentScore) {
                      outcomeLabel = 'Défaite';
                      outcomeColor = '#f87171';
                      outcomeBackground = 'rgba(239,68,68,0.20)';
                      outcomeBorder = '1px solid rgba(239,68,68,0.35)';
                    } else {
                      outcomeLabel = 'Nul';
                      outcomeColor = '#93c5fd';
                      outcomeBackground = 'rgba(59,130,246,0.20)';
                      outcomeBorder = '1px solid rgba(59,130,246,0.35)';
                    }
                  }

                  return (
                    <Box
                      key={match.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/tournois/${match.tournamentId}/matchs/${match.id}`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(
                            `/tournois/${match.tournamentId}/matchs/${match.id}`,
                          );
                        }
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.07)',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        transition:
                          'border-color 0.2s ease, transform 0.2s ease',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="white"
                        >
                          {matchTitle}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="rgba(255,255,255,0.45)"
                        >
                          {tournamentName}
                          {match.round != null ? ` · Tour ${match.round}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color="rgba(255,255,255,0.75)"
                        >
                          {formatDateTime(match.scheduledDateTime)}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.8}
                          justifyContent="flex-end"
                          alignItems="center"
                          sx={{ mt: 0.7 }}
                        >
                          <Chip
                            label={scoreLabel}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(59,130,246,0.20)',
                              color: '#93c5fd',
                              fontWeight: 700,
                              fontSize: 10,
                              border: '1px solid rgba(59,130,246,0.35)',
                            }}
                          />
                          <Chip
                            label={outcomeLabel}
                            size="small"
                            sx={{
                              bgcolor: outcomeBackground,
                              color: outcomeColor,
                              fontWeight: 700,
                              fontSize: 10,
                              border: outcomeBorder,
                            }}
                          />
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* 3. ACTION GRID (Create / Join) */}
        {!hasTeam && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CreateIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Créer une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous avez l&apos;âme d&apos;un leader ? Fondez votre propre
                  équipe, recrutez des joueurs et devenez responsable.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/equipes/creer')}
                  sx={{
                    backgroundColor: '#e8822a',
                    '&:hover': { backgroundColor: '#c86e20' },
                  }}
                >
                  Créer mon équipe
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'rgba(232,130,42,0.15)',
                    border: '2px solid #e8822a',
                    color: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <JoinIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Rejoindre une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous cherchez des frères d&apos;armes ? Parcourez
                  l&apos;annuaire des équipes et envoyez votre candidature.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/equipes')}
                  sx={{
                    color: '#e8822a',
                    borderColor: '#e8822a',
                    '&:hover': {
                      borderColor: '#c86e20',
                      backgroundColor: 'rgba(232,130,42,0.08)',
                    },
                  }}
                >
                  Chercher une équipe
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Profile;
