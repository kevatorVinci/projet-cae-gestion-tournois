import { useState, SyntheticEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  useTheme,
} from '@mui/material';
import { UserContextType } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import backgroundImage from '../../assets/images/background.png';

const LoginPage = () => {
  const { loginUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    try {
      setError('');
      await loginUser({ email, password });
      navigate('/');
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      console.error('LoginPage::error: ', err);
    }
  };

  const handleEmailInputChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setEmail(input.value);
  };

  const handlePasswordChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setPassword(input.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        backgroundImage: `linear-gradient(rgba(8, 11, 20, 0.55), rgba(8, 11, 20, 0.55)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          margin: 2,
          padding: 3,
          backgroundColor: '#1a2540',
          borderRadius: 4,
          boxShadow: 2,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" color="white" textAlign="center" mb={3}>
          Connexion
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              variant="outlined"
              value={email}
              onChange={handleEmailInputChange}
              required
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
            />
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={handlePasswordChange}
              required
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#e8822a',
              '&:hover': { backgroundColor: '#c86e20' },
            }}
          >
            Se connecter
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default LoginPage;
