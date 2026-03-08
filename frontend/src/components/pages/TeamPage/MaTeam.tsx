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
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ExitToApp as LeaveIcon,
  Event as MatchIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

export function MyTeam() {
  // Simulation de données (À lier à ton API plus tard)
  const team = {
    name: 'Dark Legion',
    wins: 2,
    members: [
      {
        id: 1,
        tag: 'SarahC',
        role: 'RESPONSABLE',
        specialty: '📐 Architecte',
        avatarSeed: 'Sara',
      },
      {
        id: 2,
        tag: 'MarcO',
        role: 'MEMBRE',
        specialty: '🛡️ Gardien',
        avatarSeed: 'Brian',
      },
      {
        id: 3,
        tag: 'ProGamer2024',
        role: 'MEMBRE',
        specialty: '🔨 Exécuteur',
        avatarSeed: 'Jack',
      },
    ],
  };

  const handleLeaveTeam = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir quitter ${team.name} ?`)) {
      console.log('Équipe quittée');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      {/* 1. BANNIÈRE HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 2,
          bgcolor: '#112b4f',
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
            <Typography variant="body2">
              🏆 {team.wins} Tournois gagnés
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
            '&:hover': { bgcolor: '#ef4444', borderColor: '#ef4444' },
          }}
        >
          Quitter l'équipe
        </Button>
      </Paper>

      {/* 2. GRILLE PRINCIPALE */}
      <Grid container spacing={4}>
        {/* COLONNE GAUCHE : MEMBRES */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              👥 Mes Coéquipiers
            </Typography>
            <List disablePadding>
              {team.members.map((member, index) => (
                <Box key={member.id}>
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                        sx={{
                          width: 50,
                          height: 50,
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>
                            {member.tag}{' '}
                            {member.tag === 'ProGamer2024' && '(Vous)'}
                          </Typography>
                          <Chip
                            label={
                              member.role === 'RESPONSABLE'
                                ? 'Responsable'
                                : 'Membre'
                            }
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor:
                                member.role === 'RESPONSABLE'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                member.role === 'RESPONSABLE'
                                  ? '#b45309'
                                  : '#64748b',
                            }}
                          />
                        </Stack>
                      }
                      secondary={
                        <Chip
                          label={member.specialty}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5, fontSize: 11 }}
                        />
                      }
                    />
                  </ListItem>
                  {index < team.members.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* COLONNE DROITE : ACTIONS */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              📅 Activité de l'équipe
            </Typography>
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="text"
                color="inherit"
                startIcon={<MatchIcon sx={{ color: '#2563eb' }} />}
                sx={{
                  justifyContent: 'space-between',
                  bgcolor: '#f8fafc',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                Planning des Matchs <Typography variant="body2">→</Typography>
              </Button>
              <Button
                fullWidth
                variant="text"
                color="inherit"
                startIcon={<HistoryIcon sx={{ color: '#2563eb' }} />}
                sx={{
                  justifyContent: 'space-between',
                  bgcolor: '#f8fafc',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                Historique de la Team <Typography variant="body2">→</Typography>
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
