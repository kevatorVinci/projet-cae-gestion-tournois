import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { getEquipeById } from '../../../services/teams';
import {
  fetchAcceptedTournamentRegistrations,
  fetchPublicTournaments,
} from '../../../services/tournaments';
import { Equipe, Tournoi } from '../../../types';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';

interface MemberCardProps {
  member: Equipe['members'][number];
  isResponsable: boolean;
  isCurrentUser: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isResponsable,
  isCurrentUser,
}) => {
  const navigate = useNavigate();

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return avatar;
    }
    return `/${avatar}`;
  };

  return (
    <Paper
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
          borderColor: isResponsable ? '#e8822a' : 'rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(26, 37, 64, 0.8)',
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        },
      }}
    >
      <Avatar
        src={normalizeAvatarUrl(member.profileImageUrl || member.profileImage)}
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

      {isCurrentUser && (
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
        label={isResponsable ? 'Responsable' : 'Membre'}
        size="small"
        sx={{
          fontSize: 10,
          fontWeight: 700,
          bgcolor: isResponsable ? '#e8822a' : '#334155',
          color: 'white',
          mt: 1.5,
          mb: 2,
        }}
      />

      <Tooltip title="Voir le profil" placement="top">
        <IconButton
          size="small"
          onClick={() => navigate(`/players/${member.id}`)}
          sx={{
            mt: 0.5,
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 1.5,
            '&:hover': {
              color: '#e8822a',
              borderColor: '#e8822a',
              bgcolor: 'rgba(232,130,42,0.08)',
            },
          }}
        >
          <VisibilityIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

export default function TeamDetails() {
  const pageBlueGradient =
    'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUserId = (() => {
    const token = getAuthenticatedUser()?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  const [team, setTeam] = useState<Equipe | null>(null);
  const [teamTournaments, setTeamTournaments] = useState<Tournoi[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return avatar;
    }
    return `/${avatar}`;
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadTeam = async () => {
      try {
        const data = await getEquipeById(id);
        setTeam(data);

        setLoadingHistory(true);
        setHistoryError(null);

        try {
          const publicTournaments =
            (await fetchPublicTournaments()) as Tournoi[];
          const checks = await Promise.all(
            publicTournaments.map(async (tournoi) => {
              const acceptedRegistrations =
                await fetchAcceptedTournamentRegistrations(tournoi.id);
              const isTeamRegistered = acceptedRegistrations.some(
                (registration) => registration.equipeId === data.id,
              );
              return isTeamRegistered ? tournoi : null;
            }),
          );

          setTeamTournaments(
            checks.filter((value): value is Tournoi => Boolean(value)),
          );
        } catch (historyErr: unknown) {
          console.error('Erreur historique tournois :', historyErr);
          setTeamTournaments([]);
          setHistoryError(
            "Impossible de charger l'historique des tournois pour le moment.",
          );
        } finally {
          setLoadingHistory(false);
        }
      } catch (err: unknown) {
        console.error('Erreur API :', err);
        setLoadingHistory(false);
      }
    };

    loadTeam();
  }, [id]);

  if (!team) {
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
        <Typography color="white">Chargement...</Typography>
      </Box>
    );
  }

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

  const tournamentsSorted = [...teamTournaments].sort(
    (a, b) =>
      parseTournamentDate(a.dateDebut) - parseTournamentDate(b.dateDebut),
  );

  const inProgressTournaments = tournamentsSorted.filter(
    (tournament) => tournament.etat === 'EN_COURS',
  );

  const upcomingTournaments = tournamentsSorted.filter(
    (tournament) =>
      tournament.etat === 'OUVERT' ||
      tournament.etat === 'CLOTURE' ||
      tournament.etat === 'BROUILLON',
  );

  const pastTournaments = tournamentsSorted
    .filter((tournament) => tournament.etat === 'TERMINE')
    .sort(
      (a, b) =>
        parseTournamentDate(b.dateDebut) - parseTournamentDate(a.dateDebut),
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

  const statusLabel: Record<Tournoi['etat'], string> = {
    BROUILLON: 'Brouillon',
    OUVERT: 'À venir',
    CLOTURE: 'À venir',
    EN_COURS: 'En cours',
    TERMINE: 'Passé',
    ANNULE: 'Annulé',
  };

  const statusColor: Record<Tournoi['etat'], string> = {
    BROUILLON: '#64748b',
    OUVERT: '#3b82f6',
    CLOTURE: '#0ea5e9',
    EN_COURS: '#f59e0b',
    TERMINE: '#10b981',
    ANNULE: '#ef4444',
  };

  const renderTournamentSection = (
    title: string,
    tournaments: Tournoi[],
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
          label={tournaments.length}
          size="small"
          sx={{ bgcolor: accentColor, color: 'white', fontWeight: 700 }}
        />
      </Stack>

      <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />

      {tournaments.length === 0 ? (
        <Typography variant="body2" color="rgba(255,255,255,0.75)">
          {emptyMessage}
        </Typography>
      ) : (
        <List disablePadding>
          {tournaments.map((tournament, index) => (
            <Box key={tournament.id}>
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
                onClick={() => navigate(`/tournois/${tournament.id}`)}
              >
                <Box>
                  <Typography fontWeight={700} color="white">
                    {tournament.nom}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.75)">
                    Début: {formatDate(tournament.dateDebut)}
                  </Typography>
                </Box>
                <Chip
                  label={statusLabel[tournament.etat]}
                  size="small"
                  sx={{
                    bgcolor: statusColor[tournament.etat],
                    color: 'white',
                    fontWeight: 700,
                  }}
                />
              </ListItem>
              {index < tournaments.length - 1 && <Divider />}
            </Box>
          ))}
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
        {/* Replaced Paper with Card here so it matches CardContent correctly */}
        <Card
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
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 📸 TEAM IMAGE */}
            {team.profileImage && (
              <Avatar
                src={normalizeAvatarUrl(team.profileImage)}
                alt={team.name}
                variant="rounded"
                sx={{
                  width: 80,
                  height: 80,
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
            )}

            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mb: 1 }}
                color="white"
              >
                {team.name}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Membres : {team.members.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box>
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
              {team.members.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Cette équipe n'a plus de membre.
                </Typography>
              )}

              {sortedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isResponsable={member.isResponsable ?? false}
                  isCurrentUser={member.id === currentUserId}
                />
              ))}
            </Box>
          </Box>

          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.10)',
              backgroundColor: '#1a2540',
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ mb: 2 }}
              color="white"
            >
              Historique des tournois
            </Typography>

            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress color="secondary" size={24} />
              </Box>
            ) : historyError ? (
              <Alert severity="warning">{historyError}</Alert>
            ) : (
              <>
                {renderTournamentSection(
                  'Tournois en cours',
                  inProgressTournaments,
                  'Aucun tournoi en cours actuellement.',
                  '#f59e0b',
                )}

                {renderTournamentSection(
                  'Tournois à venir',
                  upcomingTournaments,
                  "Aucun tournoi à venir pour l'instant.",
                  '#3b82f6',
                )}

                {renderTournamentSection(
                  'Tournois passés',
                  pastTournaments,
                  'Aucun tournoi passé pour le moment.',
                  '#10b981',
                )}
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
