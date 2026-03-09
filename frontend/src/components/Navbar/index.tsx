import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// On importe Box, IconButton et Avatar pour créer l'image cliquable
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Avatar,
} from '@mui/material';
import logo from '../../assets/images/logo.png';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

const Navbar = () => {
  const navigate = useNavigate();
  const { authenticatedUser, clearUser }: UserContextType =
    useContext(UserContext);

  // Méthode pour déconnecter le joueur et le renvoyer à l'accueil
  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a2540' }}>
      <Toolbar>
        {/* Le logo de Vinci Arena cliquable qui ramène à l'accueil */}
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
        <Button color="inherit" onClick={() => navigate('/teams')}>
          Teams
        </Button>

        {/* Si le joueur n'est PAS connecté, on affiche Connexion et Inscription */}
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
          // Si le joueur EST connecté, on affiche sa photo et le bouton Déconnexion
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginLeft: 2,
            }}
          >
            {/* Le bouton invisible qui rend l'image cliquable vers le profil */}
            <IconButton onClick={() => navigate('/profile')} sx={{ p: 0 }}>
              <Avatar
                alt="Profil du joueur"
                // On récupère l'image choisie par le joueur dans la base de données
                src={authenticatedUser.profileImage}
                sx={{
                  width: 45,
                  height: 45,
                  border: '2px solid #e8822a', // Une petite bordure orange pour faire joli
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' }, // Petit zoom quand on passe la souris
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
