import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType, Tournoi } from '../../../types';
import backgroundImage from '../../../assets/images/background.png';
import {
  getCurrentUserIdFromToken,
  getUnreadNotificationsByUser,
} from '../../../services/notifications';

const formatDate = (dateValue: string) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return parsedDate.toLocaleDateString('fr-BE');
};

const sortByDateAsc = (a: Tournoi, b: Tournoi) =>
  new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();

// ── Compteur individuel ────────────────────────────────────────────────────────
type StatCardProps = {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
};

const StatCard = ({ icon, value, label, color, onClick }: StatCardProps) => (
  <Box
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (!onClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    }}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2.5,
      py: 1.8,
      borderRadius: 3,
      bgcolor: 'rgba(17,24,39,0.75)',
      border: `1px solid ${color}33`,
      borderLeft: `4px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s ease, border-color 0.15s ease',
      '&:hover': onClick
        ? {
            transform: 'translateY(-2px)',
            borderColor: `${color}88`,
          }
        : undefined,
    }}
  >
    <Box sx={{ color, display: 'flex', fontSize: 28 }}>{icon}</Box>
    <Box>
      <Typography
        sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 900,
          fontSize: '1.5rem',
          color: 'white',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

type TournamentCardProps = {
  tournament: Tournoi;
  label: string;
  color: string;
  onClick: () => void;
  showMaxTeams?: boolean;
  showWinner?: boolean;
};

const TournamentCard = ({
  tournament,
  label,
  color,
  onClick,
  showMaxTeams = false,
  showWinner = false,
}: TournamentCardProps) => (
  <Card
    sx={{
      backgroundColor: '#111827',
      border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `4px solid ${color}`,
      borderRadius: 3,
      transition: 'transform 0.15s ease, border-color 0.15s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: color,
      },
    }}
  >
    <CardActionArea onClick={onClick}>
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
            {showMaxTeams && tournament.nombresParticipantsMax && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color,
                  mt: 0.5,
                }}
              >
                <GroupsIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  Max {tournament.nombresParticipantsMax} équipes
                </Typography>
              </Box>
            )}
            {showWinner && tournament.gagnant && (
              <Typography variant="body2" sx={{ mt: 0.5, color }}>
                Vainqueur : {String(tournament.gagnant.name)}
              </Typography>
            )}
          </Box>
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: `${color}22`,
              color,
              border: `1px solid ${color}55`,
              fontWeight: 700,
              flexShrink: 0,
            }}
          />
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

type SectionHeaderProps = {
  title: string;
  linkLabel: string;
  linkColor: string;
  onLinkClick: () => void;
};

const SectionHeader = ({
  title,
  linkLabel,
  linkColor,
  onLinkClick,
}: SectionHeaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 2,
    }}
  >
    <Typography
      variant="h6"
      fontWeight={800}
      color="white"
      sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: '1rem' }}
    >
      {title}
    </Typography>
    <Button
      variant="text"
      size="small"
      onClick={onLinkClick}
      sx={{
        color: linkColor,
        fontWeight: 700,
        fontSize: '0.8rem',
        '&:hover': { backgroundColor: `${linkColor}14` },
      }}
    >
      {linkLabel} →
    </Button>
  </Box>
);

const EmptyState = ({ message }: { message: string }) => (
  <Box
    sx={{
      py: 3,
      px: 2,
      borderRadius: 2,
      border: '1px dashed rgba(255,255,255,0.1)',
      textAlign: 'center',
      bgcolor: 'rgba(255,255,255,0.02)',
    }}
  >
    <Typography color="text.secondary" variant="body2">
      {message}
    </Typography>
  </Box>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  const [unreadCount, setUnreadCount] = useState(0);
  const [allTournaments, setAllTournaments] = useState<Tournoi[]>([]);
  const [loadingTournois, setLoadingTournois] = useState(true);

  const enCours = useMemo(
    () =>
      allTournaments.filter((t) => t.etat === 'EN_COURS').sort(sortByDateAsc),
    [allTournaments],
  );

  const aVenir = useMemo(
    () =>
      allTournaments
        .filter((t) => t.etat === 'OUVERT' || t.etat === 'CLOTURE')
        .sort(sortByDateAsc)
        .slice(0, 3),
    [allTournaments],
  );

  // ── Compteurs ─────────────────────────────────────────────────────────────
  const totalTournaments = allTournaments.length;

  const totalEnCours = useMemo(
    () => allTournaments.filter((t) => t.etat === 'EN_COURS').length,
    [allTournaments],
  );

  const totalAVenir = useMemo(
    () =>
      allTournaments.filter((t) => t.etat === 'OUVERT' || t.etat === 'CLOTURE')
        .length,
    [allTournaments],
  );
  // ──────────────────────────────────────────────────────────────────────────

  const goToTournament = useCallback(
    (id: number | string) => navigate(`/tournois/${id}`),
    [navigate],
  );

  const goToTournamentsWithFilter = useCallback(
    (etat?: 'TOUS' | 'EN_COURS' | 'A_VENIR' | 'PASSES') => {
      if (!etat || etat === 'TOUS') {
        navigate('/tournois');
        return;
      }

      navigate(`/tournois?etat=${etat}`);
    },
    [navigate],
  );

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!authenticatedUser) {
        setUnreadCount(0);
        return;
      }
      try {
        const userId = getCurrentUserIdFromToken();
        const unread = await getUnreadNotificationsByUser(userId);
        setUnreadCount(unread.length);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnreadCount();
  }, [authenticatedUser]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTournois = async () => {
      setLoadingTournois(true);
      try {
        const response = await fetch('/api/tournois/', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data: Tournoi[] = await response.json();
        setAllTournaments(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setAllTournaments([]);
      } finally {
        if (!controller.signal.aborted) setLoadingTournois(false);
      }
    };

    loadTournois();
    return () => controller.abort();
  }, []);

  return (
    <Box sx={{ background: 'transparent', minHeight: '100vh' }}>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 220, md: 280 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={backgroundImage}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.25)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,130,42,0.10), transparent)',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            px: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.3rem', md: '1.9rem' },
              letterSpacing: '0.02em',
              mb: 1.5,
            }}
          >
            Where Genius Meets Battle
          </Typography>

          {authenticatedUser ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 0.5,
              }}
            >
              <WavingHandIcon
                sx={{
                  color: '#e8822a',
                  fontSize: { xs: '1.6rem', md: '2rem' },
                }}
              />
              <Typography
                sx={{
                  color: '#e8822a',
                  fontWeight: 800,
                  fontSize: { xs: '1.3rem', md: '1.7rem' },
                  fontFamily: '"Orbitron", sans-serif',
                  letterSpacing: '0.01em',
                }}
              >
                Bienvenue
                {authenticatedUser.tag ? ` ${authenticatedUser.tag}` : ''}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
                mt: 1,
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ px: 2.5, fontSize: '0.82rem' }}
              >
                Se connecter
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: '#e8822a',
                  color: '#fff',
                  fontWeight: 700,
                  px: 2.5,
                  fontSize: '0.82rem',
                  '&:hover': { backgroundColor: '#c86e20' },
                }}
              >
                S&apos;inscrire
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── CONTENU ───────────────────────────────────────────── */}
      <Container component="main" sx={{ mt: 4, mb: 8 }} maxWidth="lg">
        {authenticatedUser && unreadCount > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 3, cursor: 'pointer' }}
            onClick={() => navigate('/notifications')}
          >
            Vous avez {unreadCount} notification
            {unreadCount > 1 ? 's' : ''} non lue
            {unreadCount > 1 ? 's' : ''}.
          </Alert>
        )}

        {loadingTournois ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e8822a' }} />
          </Box>
        ) : (
          <>
            {/* ── COMPTEURS ─────────────────────────────────────── */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <StatCard
                icon={<PlayCircleOutlineIcon fontSize="inherit" />}
                value={totalEnCours}
                label="En cours"
                color="#e8822a"
                onClick={() => goToTournamentsWithFilter('EN_COURS')}
              />
              <StatCard
                icon={<CalendarMonthIcon fontSize="inherit" />}
                value={totalAVenir}
                label="À venir"
                color="#3b82f6"
                onClick={() => goToTournamentsWithFilter('A_VENIR')}
              />
              <StatCard
                icon={<EmojiEventsIcon fontSize="inherit" />}
                value={totalTournaments}
                label="Tournois au total"
                color="#a855f7"
                onClick={() => goToTournamentsWithFilter('TOUS')}
              />
            </Stack>

            {/* ── GRILLE : seulement En cours + À venir ─────────── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 4,
                alignItems: 'start',
              }}
            >
              {/* En cours */}
              <Box>
                <SectionHeader
                  title="En cours"
                  linkLabel="Voir tout"
                  linkColor="#e8822a"
                  onLinkClick={() => goToTournamentsWithFilter('EN_COURS')}
                />
                {enCours.length === 0 ? (
                  <EmptyState message="Aucun tournoi en cours." />
                ) : (
                  <Stack spacing={2}>
                    {enCours.map((t) => (
                      <TournamentCard
                        key={t.id}
                        tournament={t}
                        label="En cours"
                        color="#e8822a"
                        onClick={() => goToTournament(t.id)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              {/* À venir */}
              <Box>
                <SectionHeader
                  title="Prochains tournois"
                  linkLabel="Voir tout"
                  linkColor="#3b82f6"
                  onLinkClick={() => goToTournamentsWithFilter('A_VENIR')}
                />
                {aVenir.length === 0 ? (
                  <EmptyState message="Aucun tournoi à venir." />
                ) : (
                  <Stack spacing={2}>
                    {aVenir.map((t) => (
                      <TournamentCard
                        key={t.id}
                        tournament={t}
                        label="À venir"
                        color="#3b82f6"
                        showMaxTeams
                        onClick={() => goToTournament(t.id)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;
