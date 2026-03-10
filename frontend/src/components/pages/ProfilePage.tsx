import React, { useState, useContext } from 'react';
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

import luffyImg from '../../assets/images/imagesProfil/luffy.png';
import pessiImg from '../../assets/images/imagesProfil/Pessi.jpg';
import zoroImg from '../../assets/images/imagesProfil/R.png';
import flashImg from '../../assets/images/imagesProfil/flash.jpg';
import milesImg from '../../assets/images/imagesProfil/miles.jpg';

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
    { name: 'Architecte', icon: '📐' },
    { name: 'Exécuteur', icon: '🔨' },
    { name: 'Tacticien', icon: '♟️' },
    { name: 'Gardien', icon: '🛡️' },
    { name: 'Catalyseur', icon: '⚡' },
    { name: 'Perturbateur', icon: '🌪️' },
    { name: 'Guérisseur', icon: '❤️' },
  ];

  const defaultImages = [luffyImg, zoroImg, pessiImg, flashImg, milesImg];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas !',
      });
      return;
    }

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
          updateUser({ specialty: specialty, profileImage: profileImage });
        }
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

  const inputSx = {
    input: { color: 'white' },
    backgroundColor: '#1e2d4a',
    borderRadius: 1,
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
      '&.Mui-focused fieldset': { borderColor: '#e8822a' },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        // Dégradé sombre à la place du background image
        background:
          'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(17,43,79,0.6), transparent), #080b14',
      }}
    >
      <Box
        sx={{
          margin: 2,
          padding: 4,
          backgroundColor: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
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
            sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}
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
                          ? '3px solid #e8822a'
                          : '3px solid transparent',
                      boxShadow:
                        profileImage === img
                          ? '0 0 15px rgba(232,130,42,0.4)'
                          : 'none',
                      transition: 'all 0.2s ease-in-out',
                      objectFit: 'cover',
                      opacity: profileImage === img ? 1 : 0.6,
                      '&:hover': { transform: 'scale(1.05)', opacity: 1 },
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
                    backgroundColor: '#1e2d4a',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.25)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8822a',
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
            sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}
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
              sx={inputSx}
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
                sx={inputSx}
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
                sx={inputSx}
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
