import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
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

  const filteredTeams = useMemo(
    () =>
      teamsState.filter((team) =>
        team.name.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, teamsState],
  );

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
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
        <Box sx={{ textAlign: 'center', mb: 5 }}>
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
            Annuaire Vinci Arena
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Recherchez les meilleures équipes et les joueurs du circuit.
          </Typography>
        </Box>

        <Box
          sx={{
            mb: 4,
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.07)',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupsIcon sx={{ color: '#e8822a', fontSize: 26 }} />
            <Typography variant="h6" fontWeight={700} color="white">
              Équipes
              {teamsState.length > 0 && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}
                >
                  ({filteredTeams.length} / {teamsState.length})
                </Typography>
              )}
            </Typography>
          </Box>

          <TextField
            placeholder="Rechercher par nom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            sx={{
              width: { xs: '100%', md: 320 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a2540',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.10)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&.Mui-focused fieldset': { borderColor: '#e8822a' },
              },
              input: { color: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredTeams.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <GroupsIcon
              sx={{ fontSize: 56, color: 'rgba(255,255,255,0.08)' }}
            />
            <Typography color="text.secondary">
              Aucune équipe trouvée.
            </Typography>
          </Box>
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
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: '#111827',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 3,
                    background: 'linear-gradient(90deg, #e8822a, transparent)',
                  }}
                />

                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    mb={1.5}
                  >
                    {team.name}
                  </Typography>

                  <Stack spacing={0.8} mb={2.5}>
                    <Typography variant="body2" color="text.secondary">
                      Responsable :{' '}
                      <Box
                        component="span"
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {team.responsable?.tag}
                      </Box>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Membres :{' '}
                      <Box
                        component="span"
                        sx={{ color: '#e8822a', fontWeight: 700 }}
                      >
                        {team.members.length}
                      </Box>
                    </Typography>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/equipes/rejoindre')}
                    sx={{
                      backgroundColor: '#e8822a',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: '#c86e20' },
                    }}
                  >
                    Rejoindre l&apos;équipe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default TeamsList;
