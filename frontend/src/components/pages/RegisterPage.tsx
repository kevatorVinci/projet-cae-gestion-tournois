import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  SelectChangeEvent,
} from '@mui/material';
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

  const specialties = [
    'architecte',
    'exécuteur',
    'tacticien',
    'gardien',
    'catalyseur',
    'perturbateur',
    'guérisseur',
  ];

  const defaultImages = [
    '/images/avatar1.png',
    '/images/avatar2.png',
    '/images/avatar3.png',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const newUser = {
      email,
      password,
      tag,
      specialty,
      profileImage,
      team: null,
    };

    try {
      const response = await fetch('/api/auths/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        navigate('/login');
      } else if (response.status === 409) {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
            />
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
            />
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              label="Tag (Pseudo)"
              fullWidth
              required
              value={tag}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTag(e.target.value)
              }
              color="primary"
              sx={{
                input: { color: theme.palette.secondary.contrastText },
              }}
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
                onChange={(e: SelectChangeEvent<string>) =>
                  setSpecialty(e.target.value)
                }
                sx={{
                  color: theme.palette.secondary.contrastText,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                }}
              >
                {specialties.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <FormControl fullWidth required>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Image de profil
              </InputLabel>
              <Select
                value={profileImage}
                label="Image de profil"
                onChange={(e: SelectChangeEvent<string>) =>
                  setProfileImage(e.target.value)
                }
                sx={{
                  color: theme.palette.secondary.contrastText,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                }}
              >
                {defaultImages.map((img) => (
                  <MenuItem key={img} value={img}>
                    Avatar{' '}
                    {img.replace('/images/avatar', '').replace('.png', '')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            S'inscrire
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
