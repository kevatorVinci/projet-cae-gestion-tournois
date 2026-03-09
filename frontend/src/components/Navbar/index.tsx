import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';
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
        <Button color="inherit" onClick={() => navigate('/teams')}>
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
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
