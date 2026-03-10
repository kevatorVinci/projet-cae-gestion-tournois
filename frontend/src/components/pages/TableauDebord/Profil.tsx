import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import {
  AddCircleOutline as CreateIcon,
  GroupAdd as JoinIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  // Simulation de l'utilisateur (sera remplacé par ton UserContext plus tard)
  const user = {
    tag: 'Pedrinho08',
    specialty: 'Tacticien',
    email: 'joueur25@gmail.com',
    avatarSeed: 'Felix',
    hasTeam: false, // Modifie ici pour tester l'affichage
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
      {/* 1. BANNIÈRE DE BIENVENUE */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: '#112b4f',
          color: 'white',
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bonjour {user.tag} 👋
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
          Bienvenue sur votre espace personnel. Il semble que vous ne fassiez
          partie d'aucune équipe pour le moment. Pour participer aux tournois,
          rejoignez une escouade ou fondez la vôtre !
        </Typography>
      </Paper>

      {/* 2. CARTE PROFIL */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`}
            sx={{ width: 80, height: 80, border: '2px solid #e2e8f0' }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {user.tag}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.specialty}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<EditIcon />} color="inherit">
          Modifier le profil
        </Button>
      </Paper>

      {/* 3. GRILLE DES ACTIONS (Créer / Rejoindre) */}
      {!user.hasTeam && (
        <Grid container spacing={3}>
          {/* CARTE CRÉER */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                height: '100%',
                transition: '0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CreateIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Créer une équipe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Vous avez l'âme d'un leader ? Fondez votre propre équipe,
                recrutez des joueurs et devenez responsable.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/equipes/creer')}
                sx={{ bgcolor: '#2563eb' }}
              >
                Créer mon équipe
              </Button>
            </Paper>
          </Grid>

          {/* CARTE REJOINDRE */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                height: '100%',
                transition: '0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#fef3c7',
                  color: '#d97706',
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <JoinIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Rejoindre une équipe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Vous cherchez des frères d'armes ? Parcourez l'annuaire des
                équipes et envoyez votre candidature.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/equipes')}
                sx={{ color: '#d97706', borderColor: '#d97706' }}
              >
                Chercher une équipe
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Profile;
