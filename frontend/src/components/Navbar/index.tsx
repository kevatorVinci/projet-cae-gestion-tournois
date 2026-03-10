import { useContext, useState } from 'react';
// ✨ NOUVEAU : On importe useLocation (le GPS)
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import logo from '../../assets/images/logo.png';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

const Navbar = () => {
  const navigate = useNavigate();
  // ✨ NOUVEAU : On active le GPS pour savoir sur quelle page on est
  const location = useLocation();

  const { authenticatedUser, clearUser }: UserContextType =
    useContext(UserContext);

  const [isAdminView, setIsAdminView] = useState(() => {
    return localStorage.getItem('isAdminView') === 'true';
  });

  const handleLogout = () => {
    clearUser();
    setIsAdminView(false);
    localStorage.removeItem('isAdminView');
    navigate('/');
  };

  // ✨ NOUVEAU : Une petite méthode magique pour colorier le bouton
  // Si le chemin du bouton est le même que le GPS actuel, on le met en orange !
  const getNavStyle = (path: string) => ({
    color: location.pathname === path ? '#e8822a' : 'inherit',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
  });

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a2540' }}>
      <Toolbar>
        {/* Le Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img
            src={logo}
            alt="Vinci Arena"
            style={{ height: '48px', marginRight: '16px' }}
          />
          {isAdminView && (
            <Chip
              label="ADMIN"
              sx={{
                backgroundColor: '#c86e20',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 1,
              }}
              size="small"
            />
          )}
        </Box>

        <Typography sx={{ flexGrow: 1 }} />

        {/* CAS 1 : Joueur NON connecté */}
        {!authenticatedUser ? (
          <>
            {/* ✨ NOUVEAU : On applique notre style magique sur chaque bouton */}
            <Button sx={getNavStyle('/')} onClick={() => navigate('/')}>
              Accueil
            </Button>
            <Button
              sx={getNavStyle('/tournaments')}
              onClick={() => navigate('/tournaments')}
            >
              Tournois
            </Button>
            <Button
              sx={getNavStyle('/teams')}
              onClick={() => navigate('/teams')}
            >
              Teams
            </Button>

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
          /* CAS 2 : Le joueur EST connecté */
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Si l'interrupteur est sur "Vue Admin" (Vrai) */}
            {isAdminView ? (
              <>
                <Button color="inherit" sx={{ fontWeight: 'bold' }}>
                  Gestion Tournoi
                </Button>

                <Button
                  sx={getNavStyle('/admin')}
                  onClick={() => navigate('/admin')}
                >
                  Admin
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    ml: 2,
                  }}
                  onClick={() => {
                    setIsAdminView(false);
                    // ✨ NOUVEAU : On écrit "faux" dans la mémoire !
                    localStorage.setItem('isAdminView', 'false');
                    navigate('/');
                  }}
                >
                  [→ Vue Joueur
                </Button>
              </>
            ) : (
              /* Si l'interrupteur est sur "Vue Joueur" (Faux) */
              <>
                {/* ✨ NOUVEAU : On applique notre style magique ici aussi ! */}
                <Button sx={getNavStyle('/')} onClick={() => navigate('/')}>
                  Accueil
                </Button>
                <Button
                  sx={getNavStyle('/tournaments')}
                  onClick={() => navigate('/tournaments')}
                >
                  Tournois
                </Button>
                <Button
                  sx={getNavStyle('/teams')}
                  onClick={() => navigate('/teams')}
                >
                  Teams
                </Button>

                {authenticatedUser.admin && (
                  <Button
                    variant="outlined"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.5)',
                      ml: 2,
                    }}
                    onClick={() => {
                      setIsAdminView(true);
                      // ✨ NOUVEAU : On écrit "vrai" dans la mémoire !
                      localStorage.setItem('isAdminView', 'true');
                      navigate('/admin');
                    }}
                  >
                    Vue Admin +
                  </Button>
                )}
              </>
            )}

            {/* ----------------- PROFIL ET DÉCONNEXION ----------------- */}

            <IconButton
              onClick={() => navigate('/profile')}
              sx={{ p: 0, ml: 2 }}
            >
              <Avatar
                alt="Profil du joueur"
                src={`/${authenticatedUser?.profileImage}`}
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
