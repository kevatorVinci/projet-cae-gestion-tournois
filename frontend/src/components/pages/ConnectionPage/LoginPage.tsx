import { useState, SyntheticEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../BoutonRetour';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { UserContextType } from '../../../types';
import { UserContext } from '../../../contexts/UserContext';
import backgroundImage from '../../../assets/images/background.png';

const LoginPage = () => {
  const { loginUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  /**
   * Toggles the visibility of the password field.
   */
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Function triggered when the user clicks on "Login".
   * We intercept errors to check if the account is banned or if credentials are bad.
   * @param {SyntheticEvent} e Form submission event.
   */
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    try {
      // Clears any previous error message
      setError('');

      // Attempts to connect via the server
      await loginUser({ email, password }, rememberMe);

      // If successful, redirects to the home page
      navigate('/');
    } catch (err: unknown) {
      // Tells TypeScript the possible shape of the error sent by the server
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      // Retrieves the error message sent by the Java server
      const errorMessage =
        error?.response?.data?.message || error?.message || '';

      // Checks if the word "banni" is inside the server error message
      if (errorMessage.toLowerCase().includes('banni')) {
        const reasonMatch = errorMessage.match(/Raison\s*:\s*(.+)/i);
        const reason = reasonMatch ? reasonMatch[1].trim() : null;
        setError(
          reason
            ? `ACCÈS REFUSÉ : Ce compte a été banni de la plateforme.\nRaison : ${reason}`
            : 'ACCÈS REFUSÉ : Ce compte a été banni de la plateforme.',
        );
      } else {
        // Vague message for security reasons (wrong email or password)
        setError('Informations incorrectes. Veuillez réessayer.');
      }

      console.error('LoginPage::error: ', err);
    }
  };

  /**
   * Updates the email state when the user types.
   * @param {SyntheticEvent} e Input change event.
   */
  const handleEmailInputChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setEmail(input.value);
  };

  /**
   * Updates the password state when the user types.
   * @param {SyntheticEvent} e Input change event.
   */
  const handlePasswordChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setPassword(input.value);
  };

  /**
   * Updates the "Remember me" checkbox state.
   * @param {SyntheticEvent} e Checkbox change event.
   */
  const handleRememberMeChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setRememberMe(input.checked);
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
        <BackButton />
        <Typography variant="h5" color="white" textAlign="center" mb={3}>
          Connexion
        </Typography>

        {/* This is where the error alert (banned or incorrect info) is displayed in red! */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
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
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={handlePasswordChange}
              required
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  sx={{ color: theme.palette.secondary.contrastText }}
                />
              }
              label="Se souvenir de moi"
              sx={{ color: theme.palette.secondary.contrastText }}
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
