import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';

// Données pour tester
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

  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
      {/* Slogan */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Where Genius Meets Battle
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Rejoins la plateforme e-sport de Vinci Arena. Forme ta team,
          inscris-toi aux tournois, domine l&apos;arène.
        </Typography>
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
      </div>

      <Typography variant="h4" component="h2" gutterBottom align="center">
        Bienvenue sur VinciArena
      </Typography>

      <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
        {/* Tournoi en cours */}
        <div style={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Tournoi en cours
          </Typography>
          {tournamentsEnCours.map((tournament) => (
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
                  Du {tournament.startDate} au {tournament.endDate}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tournois à venir */}
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

        {/* Tournois passés */}
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
  );
};

export default HomePage;
