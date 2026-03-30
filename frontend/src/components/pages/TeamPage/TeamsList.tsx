import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../components/BoutonRetour';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person'; // We add the icon for the players
import { getAllEquipes, joinEquipe } from '../../../services/teams';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType, AuthenticatedUser } from '../../../types';
import { decodeJwtPayload } from '../../../utils/session';

/**
 * Component that displays the directory of Teams and Players.
 * Users can search and apply to teams from here.
 */
const TeamsList = () => {
  const [query, setQuery] = useState('');
  const [teamsState, setTeamsState] = useState<Equipe[]>([]);

  // We add a state to store the list of players
  const [playersState, setPlayersState] = useState<AuthenticatedUser[]>([]);

  // We add a state to know which tab is currently active ('teams' or 'players')
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  useEffect(() => {
    /**
     * Loads both teams and players from the backend API.
     */
    const loadData = async () => {
      try {
        // On charge les équipes
        const teamsData = await getAllEquipes();
        setTeamsState(teamsData);

        // ✨ NOUVEAU : On ajoute le token de sécurité (le badge) pour rassurer le serveur Java !
        const playersResponse = await fetch('/api/auths/players', {
          headers: {
            Authorization: authenticatedUser?.token || '',
          },
        });

        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          setPlayersState(playersData);
        } else {
          console.error(
            "Le serveur a refusé l'accès :",
            playersResponse.status,
          );
        }
      } catch (err: unknown) {
        console.error('Erreur API :', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const currentUserId = (() => {
    const token = authenticatedUser?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  /**
   * Checks if the current authenticated user belongs to the given team.
   * * @param team The team to check
   * @return true if the user is in the team, false otherwise
   */
  const isCurrentUsersTeam = (team: Equipe) => {
    return team.members.some(
      (member) =>
        (typeof currentUserId === 'number' && member.id === currentUserId) ||
        (!!authenticatedUser?.email &&
          member.email === authenticatedUser.email) ||
        (!!authenticatedUser?.tag && member.tag === authenticatedUser.tag),
    );
  };

  /**
   * Handles the logic when a user clicks on "Postuler" (Apply).
   * * @param teamId The ID of the team
   * @param teamName The name of the team
   */
  const handlePostulerClick = async (teamId: number, teamName: string) => {
    if (!authenticatedUser) {
      navigate('/login');
      return;
    }

    const selectedTeam = teamsState.find((team) => team.id === teamId);
    const currentUsersTeam = teamsState.find((team) =>
      isCurrentUsersTeam(team),
    );

    if (
      selectedTeam &&
      currentUsersTeam &&
      selectedTeam.id !== currentUsersTeam.id
    ) {
      setMessage({
        type: 'error',
        text: 'Vous êtes déjà dans une équipe, quittez votre équipe pour la rejoindre.',
      });
      return;
    }

    if (selectedTeam && selectedTeam.members.length === 0) {
      setMessage({
        type: 'error',
        text: 'Impossible de postuler à une équipe sans effectif.',
      });
      return;
    }

    if (selectedTeam && isCurrentUsersTeam(selectedTeam)) {
      setMessage({
        type: 'error',
        text: 'Vous faites déjà partie de cette équipe.',
      });
      return;
    }

    try {
      await joinEquipe(teamId);
      setMessage({
        type: 'success',
        text: `Demande envoyée pour rejoindre ${teamName} ! 🛡️`,
      });
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/notifications');
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : "Erreur lors de l'envoi de la demande.",
      });
    }
  };

  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'teams' | 'players' | null,
  ) => {
    if (newValue !== null) {
      setActiveTab(newValue);
      // We empty the search bar when changing tabs so it's clean
      setQuery('');
      setMessage(null);
    }
  };
  // We filter the teams based on the search bar
  const filteredTeams = useMemo(
    () =>
      [...teamsState]
        .filter((team) => team.name.toLowerCase().includes(normalizedQuery))
        .sort((a, b) =>
          a.name.localeCompare(b.name, 'fr', {
            sensitivity: 'base',
          }),
        ),
    [normalizedQuery, teamsState],
  );

  // We filter the players based on the search bar
  const filteredPlayers = useMemo(
    () =>
      [...playersState]
        .filter((player) => player.tag?.toLowerCase().includes(normalizedQuery))
        .sort((a, b) =>
          (a.tag || '').localeCompare(b.tag || '', 'fr', {
            sensitivity: 'base',
          }),
        ),
    [normalizedQuery, playersState],
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

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
          <BackButton />
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

        {/* The Search and Filter bar */}
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
          {/* The Toggle Buttons (Équipes / Joueurs) */}
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={handleTabChange}
            aria-label="Sélection de la vue"
            sx={{
              backgroundColor: '#1a2540',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                '&.Mui-selected': {
                  color: 'white',
                  backgroundColor: '#e8822a',
                  '&:hover': {
                    backgroundColor: '#c86e20',
                  },
                },
              },
            }}
          >
            <ToggleButton value="teams" aria-label="Voir les équipes">
              <GroupsIcon sx={{ mr: 1 }} /> Équipes
            </ToggleButton>
            <ToggleButton value="players" aria-label="Voir les joueurs">
              <PersonIcon sx={{ mr: 1 }} /> Joueurs
            </ToggleButton>
          </ToggleButtonGroup>

          {/* The Search Input */}
          <TextField
            placeholder={
              activeTab === 'teams'
                ? 'Rechercher par nom...'
                : 'Rechercher par pseudo...'
            }
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

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        {/* 🏆 IF TEAMS TAB IS ACTIVE */}
        {activeTab === 'teams' && (
          <>
            {filteredTeams.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
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
                {filteredTeams.map((team) =>
                  (() => {
                    const isOwnTeam = isCurrentUsersTeam(team);
                    const hasNoMembers = team.members.length === 0;
                    const isPostulerDisabled = isOwnTeam || hasNoMembers;

                    return (
                      <Card
                        key={team.id}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid rgba(96,165,250,0.28)',
                          backgroundColor: '#111827',
                          position: 'relative',
                          overflow: 'hidden',
                          transition:
                            'transform 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: '#60a5fa',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            height: 3,
                            background:
                              'linear-gradient(90deg, #60a5fa, transparent)',
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
                              Nombre de personnes :{' '}
                              <Box
                                component="span"
                                sx={{ color: '#e8822a', fontWeight: 700 }}
                              >
                                {team.members.length}
                              </Box>
                            </Typography>
                          </Stack>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1.2,
                            }}
                          >
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => navigate(`/equipes/${team.id}`)}
                            >
                              Voir les détails
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() =>
                                handlePostulerClick(team.id, team.name)
                              }
                              disabled={isPostulerDisabled}
                              sx={{
                                backgroundColor: '#e8822a',
                                color: 'white',
                                fontWeight: 700,
                                '&.Mui-disabled': {
                                  backgroundColor: 'rgba(255,255,255,0.15)',
                                  color: 'rgba(255,255,255,0.5)',
                                },
                                '&:hover': {
                                  backgroundColor: '#c86e20',
                                  color: 'white',
                                },
                              }}
                            >
                              {isOwnTeam
                                ? 'Votre équipe'
                                : hasNoMembers
                                  ? 'Équipe indisponible'
                                  : 'Postuler'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })(),
                )}
              </Box>
            )}
          </>
        )}

        {/* 👤 IF PLAYERS TAB IS ACTIVE */}
        {activeTab === 'players' && (
          <>
            {filteredPlayers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <PersonIcon
                  sx={{ fontSize: 56, color: 'rgba(255,255,255,0.08)' }}
                />
                <Typography color="text.secondary">
                  Aucun joueur trouvé.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 2.5,
                }}
              >
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.email} // We use email as the unique key
                    sx={{
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.07)',
                      backgroundColor: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: '#e8822a',
                      },
                    }}
                  >
                    <Avatar
                      src={`/${player.profileImage}`}
                      alt={player.tag}
                      sx={{
                        width: 56,
                        height: 56,
                        border: '2px solid #2a3b55',
                        mr: 2,
                      }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="white"
                      >
                        {player.tag}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Box component="span" sx={{ color: '#60a5fa' }}>
                          {player.specialty}
                        </Box>
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!player.tag}
                      sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      onClick={() => {
                        if (player.tag) {
                          navigate(`/players/${encodeURIComponent(player.tag)}`);
                        }
                      }}
                    >
                      Voir le Profil
                    </Button>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TeamsList;
