import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { getAllEquipes } from '../../../services/teams.ts';

type TeamMember = {
  tag: string;
};

type Team = {
  id: number;
  name: string;
  responsable?: TeamMember;
  members: TeamMember[];
};

const TeamsList = () => {
  const [query, setQuery] = useState('');
  const [teamsState, setTeamsState] = useState<Team[]>([]);
  const navigate = useNavigate();

  // Charger les équipes depuis l'API
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = (await getAllEquipes()) as Team[];
        setTeamsState(data);
      } catch (err: unknown) {
        console.error('Erreur API :', err);
      }
    };

    loadTeams();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  // Filtrer les équipes
  const filteredTeams = useMemo(
    () =>
      teamsState.filter((team) =>
        team.name.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, teamsState],
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontFamily: '"Orbitron", sans-serif', mb: 1 }}
        >
          Annuaire Vinci Arena
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Recherchez les meilleures équipes et les joueurs du circuit.
        </Typography>
      </Box>

      {/* Barre de recherche + Tabs */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.10)',
          background:
            'linear-gradient(120deg, rgba(13,19,34,0.95) 0%, rgba(19,31,56,0.9) 100%)',
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={700}>
              Equipes
            </Typography>

            <TextField
              fullWidth
              placeholder="Rechercher par nom..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              sx={{ maxWidth: { md: 400 } }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Liste des équipes */}
      {filteredTeams.length === 0 ? (
        <Card
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.10)',
            backgroundColor: 'background.paper',
          }}
        >
          <CardContent>
            <Typography color="text.secondary">
              Aucune équipe trouvée.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 2.5,
          }}
        >
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundColor: 'background.paper',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: '#e8822a',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  {team.name}
                </Typography>

                <Stack spacing={0.8} mb={2.5} color="text.secondary">
                  <Typography variant="body2">
                    Responsable : {team.responsable?.tag}
                  </Typography>
                  <Typography variant="body2">
                    Membres : {team.members.length}
                  </Typography>
                </Stack>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  Voir l'équipe
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default TeamsList;
