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
import { ExitToApp as LeaveIcon } from '@mui/icons-material';

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
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
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
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
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
                                ? '#e8822a'
                                : '#080b14',
                            color: 'white',
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Chip
                        label={member.specialty}
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
