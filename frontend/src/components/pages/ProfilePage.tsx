import React, { useState, useContext } from 'react';
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
  // On importe les outils pour le bouton dans la case
  InputAdornment,
  IconButton,
} from '@mui/material';

// On importe les petits dessins de l'œil
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { UserContext } from '../../contexts/UserContext';

import backgroundImage from '../../assets/images/background.png';
import luffyImg from '../../assets/images/imagesProfil/luffy.png';
import pessiImg from '../../assets/images/imagesProfil/Pessi.jpg';
import zoroImg from '../../assets/images/imagesProfil/R.png';
import flashImg from '../../assets/images/imagesProfil/flash.jpg';
import milesImg from '../../assets/images/imagesProfil/miles.jpg';

export default function ProfilePage() {
  const { authenticatedUser } = useContext(UserContext);

  // --- BOÎTES POUR LE MOT DE PASSE ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- NOUVEAU : La boîte pour savoir si on cache ou on montre le mot de passe 🫣 ---
  const [showPassword, setShowPassword] = useState(false);

  // --- NOUVEAU : La méthode qui change l'état de l'œil quand on clique dessus 🖱️ ---
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // --- BOÎTES POUR L'IMAGE ET LA SPÉCIALITÉ ---
  const [specialty, setSpecialty] = useState(
    authenticatedUser?.specialty || '',
  );
  const [profileImage, setProfileImage] = useState(
    authenticatedUser?.profileImage || '',
  );

  // --- BOÎTES POUR LES MESSAGES ---
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

  // On utilise les variables qu'on a importées tout en haut ! 👇
  const defaultImages = [luffyImg, zoroImg, pessiImg, flashImg, milesImg];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: 'success', text: 'Modifications enregistrées !' });
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
                {/* On dessine chaque image de la liste */}
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
                  {/* On affiche chaque spécialité avec son petit émoji */}
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
              // On change le type de la case selon si on veut voir ou pas 👀
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
              // On ajoute le petit bouton avec l'œil à la fin de la case
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
