import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';
import backgroundImage from '../../../assets/images/background.png';
import {
  getCurrentUserIdFromToken,
  getUnreadNotificationsByUser,
} from '../../../services/notifications';

const tournamentsEnCours = [
  {
    id: 1,
    name: "Championnat d'Hiver 2025",
    startDate: '10 Déc 2025',
    endDate: '20 Déc 2025',
  },
];

const tournamentsAVenir = [
  {
    id: 2,
    name: 'Coupe de Printemps 2026',
    startDate: '15 Mars 2026',
    teamsCount: 4,
    teamsMax: 16,
  },
  {
    id: 3,
    name: 'Tournoi des Recrues',
    startDate: '10 Avril 2026',
    teamsCount: 14,
    teamsMax: 16,
  },
  {
    id: 4,
    name: 'Summer Clash',
    startDate: '20 Juillet 2026',
    teamsCount: 4,
    teamsMax: 16,
  },
];

const tournamentsPassés = [
  { id: 5, name: "Coupe d'Automne 2025", winner: 'SkyWalkers' },
  { id: 6, name: 'Édition Spéciale Halloween', winner: 'Phoenix Rising' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 340, md: 440 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background image assombri */}
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
        {/* Dégradé bas pour transition douce */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
            background: 'linear-gradient(to bottom, transparent, #080b14)',
            zIndex: 1,
          }}
        />

        {/* Contenu hero — exactement le même que l'original */}
        <Box
          sx={{ position: 'relative', zIndex: 2, textAlign: 'center', px: 3 }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Where Genius Meets Battle
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {authenticatedUser
              ? "Rejoins les tournois et domine l'arène."
              : "Rejoins la plateforme e-sport de Vinci Arena. Forme ta team, inscris-toi aux tournois, domine l'arène."}
          </Typography>
          {!authenticatedUser && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginTop: '24px',
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: '#e8822a',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#c86e20' },
                }}
              >
                S&apos;inscrire
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
              >
                Se connecter
              </Button>
            </div>
          )}
        </Box>
      </Box>

      {/* ── SECTION TOURNOIS ─────────────────────────────────────────── */}
      <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Bienvenue sur VinciArena
        </Typography>

        {authenticatedUser && unreadCount > 0 && (
          <Alert
            severity="error"
            sx={{ mb: 3, cursor: 'pointer' }}
            onClick={() => navigate('/notifications')}
          >
            Vous avez {unreadCount} notification{unreadCount > 1 ? 's' : ''} non
            lue{unreadCount > 1 ? 's' : ''}. Cliquez ici pour les consulter.
          </Alert>
        )}

        <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
          <div style={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Tournoi en cours
            </Typography>
            {tournamentsEnCours.map((tournament) => (
              <Card
                key={tournament.id}
                sx={{
                  cursor: 'pointer',
                  mb: 2,
                  borderLeft: '3px solid #e8822a',
                }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {tournament.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Du {tournament.startDate} au {tournament.endDate}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Tournoi à venir
            </Typography>
            {tournamentsAVenir.map((tournament) => (
              <Card
                key={tournament.id}
                sx={{ cursor: 'pointer', mb: 2 }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {tournament.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Début : {tournament.startDate}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    👥 {tournament.teamsCount}/{tournament.teamsMax} Équipes
                    inscrites
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Tournois passés
            </Typography>
            {tournamentsPassés.map((tournament) => (
              <Card
                key={tournament.id}
                sx={{ cursor: 'pointer', mb: 2 }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {tournament.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🏆 Vainqueur : {tournament.winner}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </Box>
  );
};

export default HomePage;
