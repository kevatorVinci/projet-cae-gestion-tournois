import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  AppBar,
  Toolbar,
  Badge,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Container,
} from '@mui/material';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f59e0b' },
    secondary: { main: '#3b82f6' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
  typography: {
    fontFamily: "'Sora', 'Segoe UI', sans-serif",
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid #334155' },
      },
    },
  },
});

const navItems = ['Accueil', 'Espace personnel', 'Tournois', 'Teams'];

function Espace() {
  const [active, setActive] = useState('Espace personnel');

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
        {/* Navbar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: '#0a0f1e',
            borderBottom: '1px solid #1e293b',
            px: 2,
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {/* Logo */}
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                flexShrink: 0,
              }}
            >
              <EmojiEventsIcon sx={{ color: '#0a0f1e', fontSize: 22 }} />
            </Box>

            {/* Nav links */}
            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item}
                  onClick={() => setActive(item)}
                  sx={{
                    color: active === item ? 'primary.main' : 'text.secondary',
                    fontWeight: active === item ? 700 : 400,
                    borderBottom:
                      active === item
                        ? '2px solid #f59e0b'
                        : '2px solid transparent',
                    borderRadius: 0,
                    px: 1.5,
                    py: 1,
                    fontSize: '0.875rem',
                    '&:hover': {
                      color: 'text.primary',
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  {item}
                </Button>
              ))}
            </Box>

            {/* Right side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton size="small">
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon
                    sx={{ color: 'text.secondary', fontSize: 20 }}
                  />
                </Badge>
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#334155',
                  color: 'text.secondary',
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                }}
              >
                Se déconnecter
              </Button>
              <Avatar
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Pedrinho08"
                sx={{ width: 34, height: 34, border: '2px solid #f59e0b' }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          {/* Welcome Banner */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
              border: '1px solid #2d4a7a',
              mb: 4,
              p: 1,
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Bonjour Pedrinho08 👋
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 520 }}
              >
                Bienvenue sur votre espace personnel. Il semble que vous ne
                fassiez partie d'aucune équipe pour le moment. Pour participer
                aux tournois Vinci Arena, vous devez rejoindre les rangs d'une
                escouade ou fonder la vôtre !
              </Typography>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 3,
              }}
            >
              <Avatar
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=Pedrinho08"
                sx={{
                  width: 72,
                  height: 72,
                  border: '3px solid #f59e0b',
                  mb: 1.5,
                }}
              />
              <Typography variant="h6">Pedrinho08</Typography>
              <Chip
                label="Tacticien"
                size="small"
                sx={{
                  bgcolor: '#1e3a5f',
                  color: '#60a5fa',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  my: 0.5,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                joueur25@gmail.com
              </Typography>
              <Button
                startIcon={<EditIcon />}
                variant="text"
                size="small"
                sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.8rem' }}
              >
                Modifier le profil
              </Button>
            </CardContent>
          </Card>

          <Divider sx={{ borderColor: '#1e293b', mb: 4 }} />

          {/* Action Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Create team */}
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  py: 4,
                  px: 3,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    border: '1px solid #334155',
                  }}
                >
                  <GroupAddIcon sx={{ color: '#94a3b8', fontSize: 26 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Créer une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, minHeight: 48 }}
                >
                  Vous avez l'âme d'un leader ? Fondez votre propre équipe,
                  choisissez un nom, recrutez des joueurs et devenez le
                  Responsable.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: 'secondary.main',
                    '&:hover': { bgcolor: '#2563eb' },
                    py: 1.2,
                  }}
                >
                  Créer mon équipe
                </Button>
              </CardContent>
            </Card>

            {/* Join team */}
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  py: 4,
                  px: 3,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    border: '1px solid #334155',
                  }}
                >
                  <PeopleIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Rejoindre une équipe
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, minHeight: 48 }}
                >
                  Vous cherchez des frères d'armes ? Parcourez l'annuaire des
                  équipes existantes et envoyez votre candidature.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': { bgcolor: '#f59e0b22' },
                    py: 1.2,
                  }}
                >
                  Chercher une équipe
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default Espace;
