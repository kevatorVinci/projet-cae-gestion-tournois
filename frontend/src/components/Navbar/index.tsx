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
import logo from '../../assets/images/logo.png';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

const Navbar = () => {
  const navigate = useNavigate();
  // On récupère le joueur actuel et le bouton pour le déconnecter
  const { authenticatedUser, clearUser }: UserContextType =
    useContext(UserContext);

  // Méthode pour déconnecter le joueur
  const handleLogout = () => {
    clearUser(); // Efface la mémoire
    navigate('/'); // Renvoie à l'accueil
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

        {/* Espace vide pour pousser les boutons vers la droite */}
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

        {/* Si le joueur n'est PAS connecté */}
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
          // Si le joueur EST connecté
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginLeft: 2,
            }}
          >
            {/* L'image de profil cliquable */}
            <IconButton onClick={() => navigate('/profile')} sx={{ p: 0 }}>
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

            {/* Le bouton de déconnexion */}
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
