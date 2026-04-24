import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BackButton from '../../BackButton';
import {
  fetchTournamentMatchesAdmin,
  fetchTournamentById,
  fetchTournamentMatches,
  publishTournamentSchedule,
  TeamMatch,
} from '../../../services/tournaments';
import { getAuthenticatedUser } from '../../../utils/session';
import TournamentBracket from './TournamentBracket';

const TournamentMatchesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);
  const [tournamentEndDate, setTournamentEndDate] = useState<string | null>(
    null,
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const toMatchId = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const queryMatchId = toMatchId(
    new URLSearchParams(location.search).get('matchId'),
  );

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Identifiant du tournoi manquant.');
        setLoading(false);
        return;
      }
      try {
        const tournoi = await fetchTournamentById(id);
        const user = getAuthenticatedUser();
        const token = user?.token;

        setIsAdmin(user?.admin === true);
        setIsPublished(tournoi.planningMatchPublie === true);
        setTournamentEndDate(tournoi.dateFin ?? null);

        let matchList: TeamMatch[] = [];
        if (tournoi.planningMatchPublie === true) {
          matchList = await fetchTournamentMatches(id);
        } else {
          if (token) {
            const adminMatches = await fetchTournamentMatchesAdmin(id, token);
            if (adminMatches.length > 0) {
              matchList = adminMatches;
            }
          }

          if (matchList.length === 0) {
            matchList = await fetchTournamentMatches(id);
          }
        }

        setTournamentName(tournoi.nom || `Tournoi #${id}`);
        setMatches(matchList);
        setSelectedMatchId((prev) => {
          if (matchList.length === 0) return null;
          if (
            queryMatchId != null &&
            matchList.some((match) => toMatchId(match.id) === queryMatchId)
          ) {
            return queryMatchId;
          }
          if (prev && matchList.some((match) => toMatchId(match.id) === prev)) {
            return prev;
          }
          return toMatchId(matchList[0].id);
        });
      } catch {
        setError('Impossible de charger les matchs.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, queryMatchId, location.key]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  const selectedMatch =
    matches.find((match) => toMatchId(match.id) === selectedMatchId) ??
    matches[0] ??
    null;

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

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 800,
              color: 'white',
              mb: 1,
            }}
          >
            Matchs
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ cursor: 'pointer', '&:hover': { color: '#e8822a' } }}
            onClick={() => navigate(`/tournois/${id}`)}
          >
            {tournamentName}
          </Typography>

          {isAdmin && matches.length > 0 && (
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                alignItems: 'center',
              }}
            >
              {isPublished ? (
                <Chip
                  label="Planning publié"
                  sx={{
                    bgcolor: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                    fontWeight: 700,
                  }}
                />
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PublishIcon />}
                  disabled={publishing}
                  onClick={async () => {
                    if (!id) return;
                    const token = getAuthenticatedUser()?.token;
                    if (!token) return;
                    setPublishing(true);
                    setPublishFeedback(null);
                    try {
                      await publishTournamentSchedule(id, token);
                      const publicMatches = await fetchTournamentMatches(id);
                      setIsPublished(true);
                      setMatches(publicMatches);
                    } catch (e) {
                      setPublishFeedback(
                        e instanceof Error
                          ? e.message
                          : 'Erreur lors de la publication.',
                      );
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  sx={{
                    bgcolor: '#e8822a',
                    '&:hover': { bgcolor: '#d97316' },
                    fontWeight: 700,
                  }}
                >
                  {publishing ? 'Publication...' : 'Publier le planning'}
                </Button>
              )}
              {publishFeedback && (
                <Alert severity="error" sx={{ py: 0 }}>
                  {publishFeedback}
                </Alert>
              )}
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {matches.length === 0 ? (
          <Card
            sx={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <CardContent
              sx={{
                py: 8,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(232,130,42,0.25), rgba(59,130,246,0.10))',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <CalendarMonthIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="white"
                  sx={{ mb: 0.5 }}
                >
                  C'est vide ici
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            <Card
              sx={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <CardContent sx={{ overflowX: 'auto', py: 3 }}>
                <TournamentBracket
                  matches={matches}
                  tournamentEndDate={tournamentEndDate}
                  selectedMatchId={toMatchId(selectedMatch?.id) ?? null}
                  onMatchSelect={(matchId) => {
                    setSelectedMatchId(matchId);
                    navigate(`/tournois/${id}/matchs/${matchId}`);
                  }}
                />
              </CardContent>
            </Card>
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default TournamentMatchesPage;
