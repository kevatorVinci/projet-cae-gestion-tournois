import React, { useState, useContext } from 'react';
// On importe useNavigate pour pouvoir voyager vers d'autres pages
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { UserContext } from '../../contexts/UserContext';

import backgroundImage from '../../assets/images/background.png';

export default function ProfilePage() {
  const { authenticatedUser, updateUser } = useContext(UserContext);

  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const [specialty, setSpecialty] = useState(
    authenticatedUser?.specialty || '',
  );
  const [profileImage, setProfileImage] = useState(
    authenticatedUser?.profileImage || '',
  );

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const specialties = [
    { name: 'architecte', icon: '📐' },
    { name: 'exécuteur', icon: '🔨' },
    { name: 'tacticien', icon: '♟️' },
    { name: 'gardien', icon: '🛡️' },
    { name: 'catalyseur', icon: '⚡' },
    { name: 'perturbateur', icon: '🌪️' },
    { name: 'guérisseur', icon: '❤️' },
  ];

  const defaultImages = [
    'luffy.png',
    'R.png',
    'Pessi.jpg',
    'flash.jpg',
    'miles.jpg',
    'keke.jpg',
  ];

  // La méthode qui s'active quand on clique sur le gros bouton orange
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✨ NOUVEAU : On vérifie que le nouveau mot de passe et la confirmation sont identiques
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas !',
      });
      return; // On arrête tout si ça ne correspond pas
    }

    // 1. On prépare le colis complet, AVEC les mots de passe ! 📦
    const updatedInfo = {
      email: authenticatedUser?.email,
      specialty: specialty,
      profileImage: profileImage,
      oldPassword: oldPassword,
      newPassword: newPassword,
    };

    try {
      const response = await fetch('/api/auths/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authenticatedUser?.token || '',
        },
        body: JSON.stringify(updatedInfo),
      });

      if (response.ok) {
        if (updateUser) {
          updateUser({
            specialty: specialty,
            profileImage: profileImage,
          });
        }

        // On vide les cases de mot de passe par sécurité
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        navigate('/');
      } else {
        setMessage({
          type: 'error',
          text: "Erreur : L'ancien mot de passe est incorrect.",
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Impossible de contacter le serveur Java.',
      });
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
      }}
    >
      <Box
        sx={{
          margin: 2,
          padding: 4,
          backgroundColor: '#1a2540',
          borderRadius: 4,
          boxShadow: 2,
          width: '100%',
          maxWidth: 600,
        }}
      >
        <Typography variant="h5" color="white" textAlign="center" mb={4}>
          Mon Profil
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave}>
          <Typography
            variant="subtitle1"
            color="white"
            mb={2}
            sx={{ borderBottom: '1px solid #2a3b55', pb: 1 }}
          >
            Mes informations visuelles
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Typography
                variant="body2"
                color="rgba(255,255,255,0.7)"
                textAlign="center"
                mb={2}
              >
                Choisissez votre avatar
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
                          ? '3px solid #4285F4'
                          : '3px solid transparent',
                      boxShadow:
                        profileImage === img
                          ? '0 0 15px rgba(66, 133, 244, 0.5)'
                          : 'none',
                      transition: 'all 0.2s ease-in-out',
                      objectFit: 'cover',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
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
                    color: 'white',
                    backgroundColor: '#2a3b55',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>-- Sélectionner --</em>
                  </MenuItem>
                  {specialties.map((spec) => (
                    <MenuItem key={spec.name} value={spec.name}>
                      {spec.icon} {spec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography
            variant="subtitle1"
            color="white"
            mb={2}
            sx={{ borderBottom: '1px solid #2a3b55', pb: 1 }}
          >
            Sécurité du compte
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Mot de passe actuel"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="Requis pour changer de mot de passe"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              sx={{
                input: { color: 'white' },
                backgroundColor: '#2a3b55',
                borderRadius: 1,
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

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nouveau mot de passe"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  backgroundColor: '#2a3b55',
                  borderRadius: 1,
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  backgroundColor: '#2a3b55',
                  borderRadius: 1,
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
            </Grid>
          </Grid>

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
            Sauvegarder les modifications
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
