import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import { User, UserContextType } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';
import { getAllEquipes } from '../../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
  TeamMatch,
} from '../../../services/tournaments';
import BackButton from '../../BackButton';
import { UserContext } from '../../../contexts/UserContext';

interface Player {
  tag: string;
  id: number;
  email?: string;
  specialty?: string;
  profileImage?: string;
  profileImageUrl?: string;
  isResponsable?: boolean;
}

interface UserLookupItem {
  id?: number;
  tag?: string;
  email?: string;
  specialty?: string;
  profileImage?: string;
  profileImageUrl?: string;
}

const pageGradient =
  'linear-gradient(135deg, #0f172a 0%, #1a2540 50%, #0f172a 100%)';

const capitalize = (value?: string): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatMatchDateTime = (value?: string): string => {
  if (!value) return 'Date non définie';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const findUserByParam = (
  list: UserLookupItem[],
  value: string,
): UserLookupItem | null => {
  const loweredValue = value.toLowerCase();
  return (
    list.find(
      (item) =>
        item.tag?.toLowerCase() === loweredValue || String(item.id) === value,
    ) || null
  );
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticatedUser } = useContext(UserContext) as UserContextType;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [participatedTournaments, setParticipatedTournaments] = useState<
    { id: number; nom: string; etat?: string; dateDebut?: string }[]
  >([]);

  const isOwnProfile = authenticatedUser?.tag === user?.tag;

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchUserAndParticipations = async () => {
      if (!id || id === 'undefined') {
        setLoading(false);
        return;
      }

      const decodedId = decodeURIComponent(id);
      const isNumericParam = !Number.isNaN(Number(decodedId));
      setLoading(true);

      try {
        const token =
          authenticatedUser?.token || getAuthenticatedUser()?.token || '';

        // 1. RECHERCHE ROBUSTE DU JOUEUR (Même s'il n'a pas d'équipe)
        let foundUser: UserLookupItem | null = null;

        // a) C'est peut-être l'utilisateur connecté ?
        const authenticatedUserWithId = authenticatedUser as
          | (typeof authenticatedUser & { id?: number })
          | undefined;
        if (
          authenticatedUserWithId &&
          (authenticatedUserWithId.tag?.toLowerCase() ===
            decodedId.toLowerCase() ||
            String(authenticatedUserWithId.id) === decodedId)
        ) {
          foundUser = authenticatedUserWithId;
        }

        // b) On cherche dans tous les utilisateurs
        if (!foundUser) {
          try {
            const usersResponse = await fetch('/api/auths/users', {
              headers: { Authorization: token ? `Bearer ${token}` : '' },
            });
            if (usersResponse.ok) {
              const usersList =
                (await usersResponse.json()) as UserLookupItem[];
              foundUser = findUserByParam(usersList, decodedId);
            }
          } catch {
            /* Ignore */
          }
        }

        // c) Fallback sur endpoint players
        if (!foundUser) {
          try {
            const playersResponse = await fetch('/api/auths/players', {
              headers: { Authorization: token ? `Bearer ${token}` : '' },
            });
            if (playersResponse.ok) {
              const playersList =
                (await playersResponse.json()) as UserLookupItem[];
              foundUser = findUserByParam(playersList, decodedId);
            }
          } catch {
            /* Ignore */
          }
        }

        // d) Dernier recours absolu : L'URL est un ID
        if (!foundUser && isNumericParam) {
          foundUser = { id: Number(decodedId), tag: `Joueur #${decodedId}` };
        }

        // 2. CHERCHER SON ÉQUIPE ACTUELLE
        const equipes = await getAllEquipes().catch(() => []);
        let foundUserInTeam: Player | null = null;
        let userTeamName = '';
        let foundTeamId: number | null = null;

        for (const equipe of equipes) {
          const listJoueurs = (equipe.members || []) as Player[];
          const member = listJoueurs.find(
            (m) =>
              m.tag?.toLowerCase() === decodedId.toLowerCase() ||
              String(m.id) === decodedId,
          );
          if (member) {
            foundUserInTeam = member;
            userTeamName = equipe.name;
            foundTeamId = equipe.id;
            break;
          }
        }

        // 3. COMPILER LES DONNÉES
        if (foundUser || foundUserInTeam) {
          const finalId = foundUser?.id || foundUserInTeam?.id || 0;
          const finalTag =
            foundUser?.tag || foundUserInTeam?.tag || 'Joueur Inconnu';
          const finalSpecialty =
            foundUser?.specialty ||
            foundUserInTeam?.specialty ||
            'Non spécifiée';

          setUser({
            id: finalId,
            tag: finalTag,
            email: foundUser?.email || '',
            specialty: finalSpecialty,
            team: userTeamName || 'Aucune équipe',
            profileImage:
              foundUser?.profileImage ||
              foundUser?.profileImageUrl ||
              foundUserInTeam?.profileImageUrl ||
              '/luffy.png',
            isResponsable: foundUserInTeam?.isResponsable || false,
          });

          setTeamId(foundTeamId);

          // 4. RÉCUPÉRER L'HISTORIQUE SÉCURISÉ (Même sans équipe actuelle)
          if (finalId > 0) {
            const allMatches = await fetchMemberMatches(finalId).catch(
              () => [],
            );

            const finishedMatches = allMatches
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

            setMatches(finishedMatches);

            // Extraire les tournois uniques
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
                  t,
                ): t is {
                  id: number;
                  nom: string;
                  etat?: string;
                  dateDebut?: string;
                } => t !== null,
              ),
            );
          }
        } else {
          setUser(null);
          setTeamId(null);
          setParticipatedTournaments([]);
          setMatches([]);
        }
      } catch (error) {
        console.error('Erreur globale lors de la récupération:', error);
        setUser(null);
        setTeamId(null);
        setParticipatedTournaments([]);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndParticipations();
  }, [id, authenticatedUser]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageGradient,
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: pageGradient,
          px: 2,
        }}
      >
        <Paper
          sx={{
            p: 4,
            bgcolor: '#1a2540',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}
        >
          <PersonIcon
            sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }}
          />
          <Typography variant="h6" color="white">
            Joueur introuvable
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.5)"
            sx={{ mt: 1 }}
          >
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        background: pageGradient,
        pt: { xs: 2, sm: 3 },
        pb: 6,
      }}
    >
      <Container maxWidth="lg">
        <BackButton onClick={handleBack} />

        <Stack spacing={4} sx={{ mt: 2 }}>
          {/* HEADER JOUEUR */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#111827',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(232,130,42,0.10), transparent 30%)',
                pointerEvents: 'none',
              }}
            />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'center', md: 'center' }}
              spacing={3}
              sx={{ position: 'relative' }}
            >
              <Avatar
                src={normalizeAvatarUrl(user.profileImage)}
                alt={user.tag}
                sx={{
                  width: { xs: 110, md: 140 },
                  height: { xs: 110, md: 140 },
                  border: '3px solid #e8822a',
                  boxShadow: '0 0 30px rgba(232,130,42,0.25)',
                }}
              />

              <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  {isOwnProfile ? 'Mes détails publics' : 'Profil joueur'}
                </Typography>

                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="#e8822a"
                  sx={{ mb: 1, lineHeight: 1.05 }}
                >
                  {user.tag}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <Chip
                    label={user.isResponsable ? 'Responsable' : 'Membre'}
                    sx={{
                      bgcolor: user.isResponsable
                        ? 'rgba(232,130,42,0.14)'
                        : 'rgba(255,255,255,0.08)',
                      color: user.isResponsable ? '#e8822a' : 'white',
                      fontWeight: 700,
                    }}
                  />
                  {isOwnProfile && (
                    <Chip
                      label="Moi"
                      sx={{
                        bgcolor: 'rgba(16,185,129,0.14)',
                        color: '#34d399',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* INFOS PERSONNELLES & EQUIPE ACTUELLE */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="white"
                sx={{ mb: 2.5 }}
              >
                Informations personnelles
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Tag
                </Typography>
                <Typography variant="body1" fontWeight={600} color="white">
                  {user.tag || '—'}
                </Typography>
              </Box>
              <Divider
                sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
              />

              {isOwnProfile && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">
                      Email
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="white"
                      sx={{ textAlign: 'right' }}
                    >
                      {user.email || '—'}
                    </Typography>
                  </Box>
                  <Divider
                    sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
                  />
                </>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Spécialité
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color="white"
                  sx={{ textAlign: 'right' }}
                >
                  {capitalize(user.specialty) || 'Non spécifiée'}
                </Typography>
              </Box>
              <Divider
                sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Rôle
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={user.isResponsable ? '#e8822a' : 'white'}
                  sx={{ textAlign: 'right' }}
                >
                  {user.isResponsable ? 'Responsable' : 'Membre'}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="white"
                sx={{ mb: 2.5 }}
              >
                Équipe actuelle
              </Typography>

              <Box
                role={teamId ? 'button' : undefined}
                tabIndex={teamId ? 0 : undefined}
                onClick={() => {
                  if (teamId) navigate(`/equipes/${teamId}`);
                }}
                onKeyDown={(event) => {
                  if (teamId && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigate(`/equipes/${teamId}`);
                  }
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  cursor: teamId ? 'pointer' : 'default',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                  '&:hover': teamId
                    ? { borderColor: '#e8822a', transform: 'translateY(-2px)' }
                    : undefined,
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <GroupsIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Équipe actuelle
                  </Typography>
                </Box>
                <Typography variant="h6" color="white" fontWeight={700}>
                  {user.team || 'Aucune équipe'}
                </Typography>
                <Typography
                  variant="body2"
                  color="rgba(255,255,255,0.5)"
                  sx={{ mt: 1 }}
                >
                  {teamId
                    ? 'Cliquez pour consulter la page de l’équipe.'
                    : 'Ce joueur ne fait actuellement partie d’aucune équipe.'}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* ── Tournois & Matchs historiques ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
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

              {participatedTournaments.length === 0 ? (
                <Typography variant="body2" color="rgba(255,255,255,0.4)">
                  Aucun tournoi pour le moment.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {participatedTournaments.map((tournament) => {
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
                          if (e.key === 'Enter' || e.key === ' ')
                            navigate(`/tournois/${tournament.id}`);
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
                          transition: 'border-color 0.2s',
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
                              {new Date(
                                tournament.dateDebut,
                              ).toLocaleDateString('fr-BE')}
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
                <SportsMartialArtsIcon
                  sx={{ color: '#3b82f6', fontSize: 22 }}
                />
                <Typography variant="h6" fontWeight={700} color="white">
                  Historique des matchs
                </Typography>
              </Box>

              {matches.length === 0 ? (
                <Typography variant="body2" color="rgba(255,255,255,0.4)">
                  Aucun match joué pour le moment.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {matches.map((match) => {
                    const isTeam1 = teamId != null && match.team1Id === teamId;
                    const isTeam2 = teamId != null && match.team2Id === teamId;

                    const matchTitle = `${match.team1Name ?? '?'} vs ${match.team2Name ?? '?'}`;
                    const tournamentName =
                      participatedTournaments.find(
                        (t) => t.id === match.tournamentId,
                      )?.nom ?? `Tournoi #${match.tournamentId}`;
                    const hasScore =
                      typeof match.scoreTeam1 === 'number' &&
                      typeof match.scoreTeam2 === 'number';

                    let scoreLabel = 'Score indisponible';
                    if (hasScore) {
                      scoreLabel = `${match.scoreTeam1} - ${match.scoreTeam2}`;
                    }

                    let outcomeLabel = 'Terminé';
                    let outcomeColor = '#94a3b8';
                    let outcomeBackground = 'rgba(148,163,184,0.20)';
                    let outcomeBorder = '1px solid rgba(148,163,184,0.35)';

                    if (hasScore) {
                      const score1 = Number(match.scoreTeam1);
                      const score2 = Number(match.scoreTeam2);

                      if (isTeam1 || isTeam2) {
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
                      } else {
                        // Le joueur n'a pas d'équipe actuellement, on affiche juste qui a gagné le match
                        if (score1 > score2) {
                          outcomeLabel = `Victoire de ${match.team1Name ?? 'Éq 1'}`;
                          outcomeColor = '#34d399';
                        } else if (score1 < score2) {
                          outcomeLabel = `Victoire de ${match.team2Name ?? 'Éq 2'}`;
                          outcomeColor = '#34d399';
                        } else {
                          outcomeLabel = 'Match nul';
                          outcomeColor = '#93c5fd';
                        }
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
                            {match.round != null
                              ? ` · Tour ${match.round}`
                              : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color="rgba(255,255,255,0.75)"
                          >
                            {formatMatchDateTime(match.scheduledDateTime)}
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
        </Stack>
      </Container>
    </Box>
  );
}
