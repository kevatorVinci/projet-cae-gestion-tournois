import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';
import logo from '../../assets/images/logo.png';

const Navbar = () => {
  const navigate = useNavigate();

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
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
