import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
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

const HomePage = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allTournaments, setAllTournaments] = useState<Tournoi[]>([]);
  const [loadingTournois, setLoadingTournois] = useState(true);

  const enCours = allTournaments.filter((t) => t.etat === 'EN_COURS');
  const aVenir = allTournaments
    .filter((t) => t.etat === 'OUVERT' || t.etat === 'CLOTURE')
    .slice(0, 3);

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
    const loadTournois = async () => {
      setLoadingTournois(true);
      try {
        const response = await fetch('/api/tournois/');
        if (!response.ok) throw new Error('Failed to fetch');
        const data: Tournoi[] = await response.json();
        setAllTournaments(data);
      } catch {
        setAllTournaments([]);
      } finally {
        setLoadingTournois(false);
      }
    };
    loadTournois();
  }, []);

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 380, md: 500 },
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
            filter: 'brightness(0.2)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,130,42,0.12), transparent)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background: 'linear-gradient(to bottom, transparent, #080b14)',
            zIndex: 1,
          }}
        />

        <Box
          sx={{ position: 'relative', zIndex: 2, textAlign: 'center', px: 3 }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3.2rem' },
              letterSpacing: '0.02em',
            }}
          >
            Where Genius Meets Battle
          </Typography>
          {authenticatedUser && (
            <Typography
              variant="h6"
              sx={{
                color: '#e8822a',
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Bienvenue
              {authenticatedUser.tag ? `, ${authenticatedUser.tag}` : ''} 👋
            </Typography>
          )}
          <Typography
            variant="h6"
            color="text.secondary"
            gutterBottom
            sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.6 }}
          >
            {authenticatedUser
              ? "Rejoins les tournois et domine l'arène."
              : "Rejoins la plateforme e-sport de Vinci Arena. Forme ta team, inscris-toi aux tournois, domine l'arène."}
          </Typography>
          {!authenticatedUser && (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 4 }}
              >
                Se connecter
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: '#e8822a',
                  color: '#fff',
                  fontWeight: 700,
                  px: 4,
                  '&:hover': { backgroundColor: '#c86e20' },
                }}
              >
                S&apos;inscrire
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      {!loadingTournois && (
        <Box
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 4, md: 10 },
                py: 3,
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Tournois en cours', value: enCours.length },
                { label: 'Prochains tournois', value: aVenir.length },
                {
                  label: 'Total tournois',
                  value: allTournaments.length,
                },
              ].map((stat) => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ color: '#e8822a', lineHeight: 1 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* ── CONTENU ──────────────────────────────────────────────────── */}
      <Container component="main" sx={{ mt: 6, mb: 8 }} maxWidth="lg">
        {authenticatedUser && unreadCount > 0 && (
          <Alert
            severity="error"
            sx={{ mb: 4, cursor: 'pointer' }}
            onClick={() => navigate('/notifications')}
          >
            Vous avez {unreadCount} notification{unreadCount > 1 ? 's' : ''} non
            lue{unreadCount > 1 ? 's' : ''}. Cliquez ici pour les consulter.
          </Alert>
        )}

        {loadingTournois ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e8822a' }} />
          </Box>
        ) : (
          <>
            {/* ── EN COURS ─────────────────────────────────────────── */}
            <Box sx={{ mb: 8 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {/* Dot pulsant */}
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#e8822a',
                    boxShadow: '0 0 0 0 rgba(232,130,42,0.6)',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': {
                        boxShadow: '0 0 0 0 rgba(232,130,42,0.6)',
                      },
                      '70%': {
                        boxShadow: '0 0 0 8px rgba(232,130,42,0)',
                      },
                      '100%': {
                        boxShadow: '0 0 0 0 rgba(232,130,42,0)',
                      },
                    },
                  }}
                />
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="white"
                  sx={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '1.1rem',
                  }}
                >
                  En ce moment
                </Typography>
              </Box>

              {enCours.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 3,
                    borderRadius: 2,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    textAlign: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    Aucun tournoi en cours pour le moment.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: enCours.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                    },
                  }}
                >
                  {enCours.map((tournament) => (
                    <Card
                      key={tournament.id}
                      sx={{
                        backgroundColor: '#0d1117',
                        border: '1px solid rgba(232,130,42,0.3)',
                        borderLeft: '4px solid #e8822a',
                        borderRadius: 2,
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(232,130,42,0.15)',
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => navigate(`/tournois/${tournament.id}`)}
                        sx={{ p: 0 }}
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
                              variant="h6"
                              fontWeight={700}
                              color="white"
                            >
                              {tournament.nom}
                            </Typography>
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
                                ml: 1,
                                flexShrink: 0,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Du {formatDate(tournament.dateDebut)} au{' '}
                            {formatDate(tournament.dateFin)}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            {/* ── À VENIR ──────────────────────────────────────────── */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="white"
                  sx={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '1.1rem',
                  }}
                >
                  Prochains tournois
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/tournois')}
                  sx={{
                    color: '#e8822a',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    '&:hover': { backgroundColor: 'rgba(232,130,42,0.08)' },
                  }}
                >
                  Voir tout →
                </Button>
              </Box>

              {aVenir.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 3,
                    borderRadius: 2,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    textAlign: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    Aucun tournoi à venir pour le moment.
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
                  {aVenir.map((tournament) => (
                    <Card
                      key={tournament.id}
                      sx={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 2,
                        transition: 'transform 0.15s, border-color 0.15s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'rgba(232,130,42,0.3)',
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => navigate(`/tournois/${tournament.id}`)}
                        sx={{ p: 0, height: '100%' }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color="white"
                            gutterBottom
                          >
                            {tournament.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Début : {formatDate(tournament.dateDebut)}
                          </Typography>
                          {tournament.nombresParticipantsMax && (
                            <Typography
                              variant="body2"
                              sx={{ color: '#e8822a', mt: 0.5 }}
                            >
                              👥 Max {tournament.nombresParticipantsMax} équipes
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              )}

              {/* CTA final */}
              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/tournois')}
                  sx={{
                    borderColor: '#e8822a',
                    color: '#e8822a',
                    fontWeight: 700,
                    px: 5,
                    '&:hover': {
                      borderColor: '#c86e20',
                      backgroundColor: 'rgba(232,130,42,0.06)',
                    },
                  }}
                >
                  Explorer tous les tournois
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;
