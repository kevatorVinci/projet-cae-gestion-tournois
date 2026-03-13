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
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType } from '../../../types';
import { getUserTeam } from '../../../services/teams';
import BackButton from '../../../components/BoutonRetour';

const Profile = () => {
  const navigate = useNavigate();
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState<Equipe | null>(null);

  useEffect(() => {
    if (authenticatedUser) {
      getUserTeam()
        .then((currentTeam) => {
          setTeam(currentTeam);
          setHasTeam(!!currentTeam);
        })
        .catch(() => {
          setTeam(null);
          setHasTeam(false);
        });
    } else {
      setTeam(null);
      setHasTeam(false);
    }
  }, [authenticatedUser]);

  const userTag = authenticatedUser?.tag || 'Joueur';
  const userRole = authenticatedUser?.specialty || 'Rôle non défini';
  const userEmail = authenticatedUser?.email || 'Email non disponible';
  const userAvatar =
    authenticatedUser?.profileImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userTag}`;

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      {/* Dégradé bleu nuit en haut à la place du background image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(30,58,95,0.45), transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Grille SVG très subtile */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.035,
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            x="0"
            y="0"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </Box>

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* 1. BANNIÈRE DE BIENVENUE */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background:
              'linear-gradient(135deg, rgba(17,43,79,0.9) 0%, rgba(26,37,64,0.9) 100%)',
            border: '1px solid rgba(44,90,142,0.35)',
            color: 'white',
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <BackButton />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bonjour {userTag} 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
            {hasTeam
              ? "Vous faites partie d'une équipe. Accédez à votre espace d'équipe pour gérer les membres et suivre votre progression !"
              : "Bienvenue sur votre espace personnel. Il semble que vous ne fassiez partie d'aucune équipe pour le moment. Pour participer aux tournois, rejoignez une escouade ou fondez la vôtre !"}
          </Typography>
        </Paper>

        {/* 2. CARTE PROFIL */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={userAvatar}
              sx={{ width: 80, height: 80, border: '2px solid #e8822a' }}
            />
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {userTag}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userRole}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Équipe : {team?.name || "Pas d'équipe"}
              </Typography>
            </Box>
          </Stack>

          {/* Les boutons d'action du profil ajoutés ici 👇 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/disponibilites')}
              sx={{
                backgroundColor: '#e8822a',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#c86e20',
                },
              }}
            >
              Mes indisponibilités
            </Button>

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/profile')}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: '#e8822a',
                  color: '#e8822a',
                  backgroundColor: 'rgba(232,130,42,0.08)',
                },
              }}
            >
              Modifier le profil
            </Button>
          </Stack>
        </Paper>

        {/* 3. GRILLE DES ACTIONS (Créer / Rejoindre) */}
        {!hasTeam && (
          <Grid container spacing={3}>
            {/* CARTE CRÉER */}
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CreateIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Créer une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous avez l&apos;âme d&apos;un leader ? Fondez votre propre
                  équipe, recrutez des joueurs et devenez responsable.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/equipes/creer')}
                  sx={{
                    backgroundColor: '#e8822a',
                    '&:hover': { backgroundColor: '#c86e20' },
                  }}
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
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#e8822a',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'rgba(232,130,42,0.15)',
                    border: '2px solid #e8822a',
                    color: '#e8822a',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <JoinIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="white"
                >
                  Rejoindre une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vous cherchez des frères d&apos;armes ? Parcourez
                  l&apos;annuaire des équipes et envoyez votre candidature.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/equipes')}
                  sx={{
                    color: '#e8822a',
                    borderColor: '#e8822a',
                    '&:hover': {
                      borderColor: '#c86e20',
                      backgroundColor: 'rgba(232,130,42,0.08)',
                    },
                  }}
                >
                  Chercher une équipe
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Profile;
