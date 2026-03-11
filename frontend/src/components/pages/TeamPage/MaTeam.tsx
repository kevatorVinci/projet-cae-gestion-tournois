import { useContext, useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ExitToApp as LeaveIcon } from '@mui/icons-material';
import {
  getAllEquipes,
  isCurrentUserResponsable,
  leaveEquipe,
} from '../../../services/teams';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType } from '../../../types';

export function MyTeam() {
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [team, setTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadMyTeam = async () => {
      try {
        const [equipes, responsable] = await Promise.all([
          getAllEquipes(),
          isCurrentUserResponsable(),
        ]);

        const myTag = authenticatedUser?.tag;
        const myTeam =
          equipes.find((equipe) =>
            equipe.members.some((member) => member.tag === myTag),
          ) ?? null;

        setTeam(myTeam);
        setIsResponsable(responsable);
      } catch (err: unknown) {
        console.error('Erreur API :', err);
        setMessage('Impossible de charger votre equipe pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    loadMyTeam();
  }, [authenticatedUser?.tag]);

  const handleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    if (!window.confirm(`Etes-vous sur de vouloir quitter ${team.name} ?`)) {
      return;
    }

    try {
      await leaveEquipe();
      setTeam(null);
      setIsResponsable(false);
      setMessage('Vous avez quitte votre equipe.');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      setMessage("Impossible de quitter l'equipe actuellement.");
    }
  };

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

  if (!team) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
          p: 3,
        }}
      >
        <Alert severity="info">Vous n&apos;etes dans aucune equipe.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}

        {/* 1. BANNIÈRE HEADER */}
        <Paper
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
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Membre de l'équipe
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {team.name}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                👥 {team.members.length} Membres
              </Typography>
            </Stack>
          </Box>
          <Button
            variant="outlined"
            startIcon={<LeaveIcon />}
            onClick={handleLeaveTeam}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': { bgcolor: '#c86e20', borderColor: '#c86e20' },
            }}
          >
            Quitter l'équipe
          </Button>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: '#1a2540',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            color="white"
          >
            👥 Mes Coéquipiers
          </Typography>
          <List disablePadding>
            {team.members.map((member, index) => (
              <Box key={member.id}>
                <ListItem sx={{ py: 2, px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={member.profileImageUrl || member.profileImage}
                      sx={{
                        width: 50,
                        height: 50,
                        border: '1px solid rgba(255,255,255,0.20)',
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          <Typography
                            component="span"
                            fontWeight={700}
                            color="white"
                          >
                            {member.tag}{' '}
                            {member.tag === 'ProGamer2024' && '(Vous)'}
                          </Typography>
                        </Typography>
                        <Chip
                          label={
                            isResponsable &&
                            member.tag === authenticatedUser?.tag
                              ? 'Responsable'
                              : 'Membre'
                          }
                          size="small"
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            bgcolor:
                              isResponsable &&
                              member.tag === authenticatedUser?.tag
                                ? '#e8822a'
                                : '#080b14',
                            color: 'white',
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Chip
                        label={member.specialty || 'Membre'}
                        size="small"
                        variant="outlined"
                        sx={{
                          mt: 0.5,
                          fontSize: 11,
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.25)',
                        }}
                      />
                    }
                  />
                </ListItem>
                {index < team.members.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
}
