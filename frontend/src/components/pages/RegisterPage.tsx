import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BoutonRetour';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import backgroundImage from '../../assets/images/background.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const specialties = [
    { name: 'Architecte', icon: '📐' },
    { name: 'Exécuteur', icon: '🔨' },
    { name: 'Tacticien', icon: '♟️' },
    { name: 'Gardien', icon: '🛡️' },
    { name: 'Catalyseur', icon: '⚡' },
    { name: 'Perturbateur', icon: '🌪️' },
    { name: 'Guérisseur', icon: '❤️' },
  ];

  const defaultImages = [
    'butcher.jpg',
    'eren.png',
    'erza.jpg',
    'femmecars.jpg',
    'flash.jpg',
    'garou.jpg',
    'itadori.jpg',
    'jjk.jpg',
    'kaido.png',
    'lookism.jpg',
    'luffy.png',
    'makima.jpg',
    'miles.jpg',
    'neon2.jpg',
    'Pessi.jpg',
    'pevin.jpg',
    'pion.jpg',
    'spiderman2099.jpg',
    'tailong.jpg',
    'crockmou.jpg',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!profileImage) {
      setErrorMessage("N'oubliez pas de choisir un avatar !");
      return;
    }

    const newUser = {
      email,
      password,
      tag,
      specialty,
      profileImage: profileImage,
      team: null,
    };

    try {
      const response = await fetch('/api/auths/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        navigate('/login');
      } else if (response.status === 401) {
        setErrorMessage('Cette adresse email est déjà utilisée.');
      } else {
        setErrorMessage(
          "Erreur lors de l'inscription. Vérifiez vos informations.",
        );
      }
    } catch {
      setErrorMessage('Impossible de se connecter au serveur.');
    }
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
          maxWidth: 600,
        }}
      >
        <BackButton />
        <Typography variant="h5" color="white" textAlign="center" mb={3}>
          Inscription
        </Typography>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister}>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              color="primary"
              sx={{ input: { color: theme.palette.secondary.contrastText } }}
            />
          </Box>

          <Box sx={{ marginBottom: 2 }}>
            <TextField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              color="primary"
              sx={{ input: { color: theme.palette.secondary.contrastText } }}
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
            <TextField
              label="Tag (Pseudo)"
              fullWidth
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              color="primary"
              sx={{ input: { color: theme.palette.secondary.contrastText } }}
            />
          </Box>

          <Box sx={{ marginBottom: 2 }}>
            <FormControl fullWidth required>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Spécialité
              </InputLabel>
              <Select
                value={specialty}
                label="Spécialité"
                onChange={(e) => setSpecialty(e.target.value)}
                sx={{
                  color: 'white',
                  backgroundColor: '#2a3b55',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                }}
              >
                {specialties.map((spec) => (
                  <MenuItem key={spec.name} value={spec.name}>
                    {spec.icon} {spec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ marginBottom: 3 }}>
            <Typography
              variant="body2"
              color="rgba(255, 255, 255, 0.7)"
              textAlign="center"
              mb={1}
            >
              Choisissez votre avatar *
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {defaultImages.map((img, index) => (
                <Box
                  key={index}
                  component="img"
                  src={img}
                  alt={`Avatar ${index}`}
                  onClick={() => setProfileImage(img)}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border:
                      profileImage === img
                        ? '3px solid #e8822a'
                        : '3px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                    objectFit: 'cover',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#e8822a',
              '&:hover': { backgroundColor: '#c86e20' },
              padding: 1.5,
              fontSize: '1.1rem',
            }}
          >
            S'inscrire
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
