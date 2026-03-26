import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';

import BackButton from '../BoutonRetour';
import { fetchAllTournaments } from '../../services/tournois';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType, Tournoi } from '../../types';

/**
 * Admin version of the Tournaments page.
 * Lists all tournaments and allows navigation to creation and edition pages.
 * Displays a nice text for Draft tournaments.
 *
 * @return {JSX.Element} the admin tournament management page
 */
const AdminTournamentsPage = () => {
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the tournaments when the component mounts.
   */
  useEffect(() => {
    const loadTournaments = async () => {
      if (!authenticatedUser?.token) return;
      try {
        setLoading(true);
        const data = await fetchAllTournaments(authenticatedUser.token);
        setTournaments(data);
      } catch (err) {
        setError('Impossible de charger les tournois.');
      } finally {
        setLoading(false);
      }
    };
    loadTournaments();
  }, [authenticatedUser]);

  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString('fr-BE');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 5,
        backgroundColor: '#080b14',
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
        <Box sx={{ textAlign: 'center', mb: 5, position: 'relative' }}>
          <BackButton />

          <Button
            variant="contained"
            onClick={() => navigate('/admin/tournaments/create')}
            sx={{
              position: { xs: 'static', md: 'absolute' },
              right: 0,
              top: 0,
              backgroundColor: '#e8822a',
              color: 'white',
              fontWeight: 'bold',
              mb: { xs: 2, md: 0 },
              '&:hover': { backgroundColor: '#c86e20' },
            }}
          >
            + Créer un tournoi
          </Button>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 800,
              mb: 1,
              color: 'white',
            }}
          >
            Gestion des Tournois ⚙️
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#e8822a' }} />
            </Box>
          )}
          {error && <Typography color="error">{error}</Typography>}
          {!loading && !error && tournaments.length === 0 && (
            <Typography color="text.secondary">
              Aucun tournoi trouvé.
            </Typography>
          )}

          {!loading &&
            !error &&
            tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                sx={{
                  mb: 2,
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft:
                    tournament.etat === 'BROUILLON'
                      ? '4px solid #6b7280'
                      : '4px solid #e8822a',
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" color="white" fontWeight={700}>
                      {tournament.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Du {formatDate(tournament.dateDebut)} au{' '}
                      {formatDate(tournament.dateFin)}
                    </Typography>

                    {/* ✨ MAGIC : We show 'En attente de publication' to the user, but the data is still 'BROUILLON' */}
                    <Chip
                      label={
                        tournament.etat === 'BROUILLON'
                          ? 'En attente de publication'
                          : tournament.etat
                      }
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor:
                          tournament.etat === 'BROUILLON'
                            ? '#4b5563'
                            : 'rgba(232, 130, 42, 0.2)',
                        color:
                          tournament.etat === 'BROUILLON' ? 'white' : '#e8822a',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>

                  {tournament.etat === 'BROUILLON' && (
                    <Button
                      variant="outlined"
                      onClick={() =>
                        navigate(`/admin/tournaments/edit/${tournament.id}`)
                      }
                      sx={{
                        color: '#e8822a',
                        borderColor: '#e8822a',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 130, 42, 0.1)',
                        },
                      }}
                    >
                      Modifier
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </Box>
      </Container>
    </Box>
  );
};

export default AdminTournamentsPage;
