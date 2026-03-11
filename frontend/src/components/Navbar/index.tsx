import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Avatar,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import logo from '../../assets/images/logo.png';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

const Navbar = () => {
  const navigate = useNavigate();
  const { authenticatedUser, clearUser }: UserContextType =
    useContext(UserContext);

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a2540' }}>
      <Toolbar>
        <img
          src={logo}
          alt="Vinci Arena"
          style={{ height: '48px', cursor: 'pointer', marginRight: '16px' }}
          onClick={() => navigate('/')}
        />

        <Typography sx={{ flexGrow: 1 }} />

        <Button color="inherit" onClick={() => navigate('/')}>
          Accueil
        </Button>
        <Button color="inherit" onClick={() => navigate('/tournaments')}>
          Tournois
        </Button>
        <Button color="inherit" onClick={() => navigate('/equipes')}>
          Teams
        </Button>
        {authenticatedUser && (
          <IconButton
            color="inherit"
            aria-label="notifications"
            onClick={() => navigate('/notifications')}
            sx={{ ml: 1 }}
          >
            <NotificationsNoneIcon />
          </IconButton>
        )}

        {/* Si le joueur n'est pas connecté */}
        {!authenticatedUser ? (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Connexion
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: '#e8822a',
                color: '#ffffff',
                marginLeft: 1,
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Inscription
            </Button>
          </>
        ) : (
          // Si le joueur est connecté
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginLeft: 2,
            }}
          >
            <IconButton onClick={() => navigate('/profil')} sx={{ p: 0 }}>
              <Avatar
                alt="Profil du joueur"
                src={authenticatedUser?.profileImage}
                sx={{
                  width: 45,
                  height: 45,
                  border: '2px solid #e8822a',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              />
            </IconButton>

            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                backgroundColor: '#e8822a',
                color: '#ffffff',
                marginLeft: 1,
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Se déconnecter
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
