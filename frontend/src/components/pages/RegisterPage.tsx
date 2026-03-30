import React, { useEffect, useState } from 'react';
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
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Equipe } from '../../types';
import { registerUser } from '../../services/auth';
import { getAllEquipes, joinEquipe } from '../../services/teams';
import {
  clearAuthenticatedUser,
  storeAuthenticatedUser,
} from '../../utils/session';

import backgroundImage from '../../assets/images/background.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [teams, setTeams] = useState<Equipe[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // State to track the current page of avatars (starts at 0)
  const [imagePage, setImagePage] = useState(0);

  useEffect(() => {
    getAllEquipes()
      .then((data) => setTeams(data))
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, []);

  /**
   * Toggles the visibility of the password input.
   */
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Calculates the strength of the password.
   * @param pwd The password string to evaluate.
   * @returns The strength score out of 5.
   */
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strengthScore = calculateStrength(password);

  let barColor = 'transparent';
  let strengthLabel = '';
  let barWidth = '0%';

  if (password.length > 0) {
    if (strengthScore <= 2) {
      barColor = '#ef4444';
      strengthLabel = 'Mot de passe faible ❌';
      barWidth = '33%';
    } else if (strengthScore === 3 || strengthScore === 4) {
      barColor = '#f97316';
      strengthLabel = 'Mot de passe moyen ⚠️';
      barWidth = '66%';
    } else if (strengthScore === 5) {
      barColor = '#22c55e';
      strengthLabel = 'Mot de passe fort ✅';
      barWidth = '100%';
    }
  }

  const specialties = [
    { name: 'Architecte', icon: '📐' },
    { name: 'Exécuteur', icon: '🔨' },
    { name: 'Tacticien', icon: '♟️' },
    { name: 'Gardien', icon: '🛡️' },
    { name: 'Catalyseur', icon: '⚡' },
    { name: 'Perturbateur', icon: '🌪️' },
    { name: 'Guérisseur', icon: '❤️' },
  ];

  // The complete list of 40 avatars, based on the file explorer view
  const allImages = [
    // Page 1 (0 to 11) - Row 1
    'butcher.jpg', 'chat.jpg', 'chouine.jpg', 'crockmou.jpg', 'denji.jpg', 'dexter.jpg',
    'djilsi.png', 'enfant.jpg', 'eren.png', 'erza.jpg', 'femmecars.jpg', 'flash.jpg',
    
    // Page 1 continued (12 to 19) / start of page 2 (20 to 23) - Row 2
    'fou.jpg', 'garou.jpg', 'gazo.jpg', 'homer.jpg', 'isagi.jpg', 'itadori.jpg',
    'jjk.jpg', 'joe.jpg', 'kaido.png', 'lapin.jpg', 'lion.jpg', 'lookism.jpg',
    
    // Page 2 continued (24 to 35) - Row 3
    'luffy.png', 'makima.jpg', 'miles.jpg', 'neon2.jpg', 'Pessi.jpg', 'pevin.jpg',
    'pion.jpg', 'saitama.jpg', 'shigaraki.jpg', 'shrek.jpg', 'spiderman2099.jpg', 'tailong.jpg',
    
    // Page 2 continued (36 to 39) - Row 4
    'tk.jpg', 'vini.jpg', 'yuichi.png', 'speed.jpg'
  ];

  // Exactly 20 images per page to form a 5x4 grid
  const imagesPerPage = 20;

  /**
   * Goes to the previous page of avatars.
   */
  const handlePrevPage = () => {
    if (imagePage > 0) {
      setImagePage(imagePage - 1);
    }
  };

  /**
   * Goes to the next page of avatars.
   */
  const handleNextPage = () => {
    const maxPage = Math.ceil(allImages.length / imagesPerPage) - 1;
    if (imagePage < maxPage) {
      setImagePage(imagePage + 1);
    }
  };

  // Cuts the big array to keep only the 20 images of the current page
  const displayedImages = allImages.slice(
    imagePage * imagesPerPage,
    (imagePage + 1) * imagesPerPage
  );

  /**
   * Handles the registration form submission.
   * @param e The form event triggered when the user clicks submit.
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage("Oups ! L'email est obligatoire pour s'inscrire. 📧");
      return;
    }

    if (!tag) {
      setErrorMessage("Hé ! Tu as oublié de choisir un super pseudo (Tag) ! 🦸");
      return;
    }

    if (!profileImage) {
      setErrorMessage("N'oublie pas de choisir ton plus bel avatar ! 🖼️");
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
      const result = await registerUser(newUser);

      if (result.ok) {
        const { authenticatedUser } = result;

        if (selectedTeamId) {
          try {
            storeAuthenticatedUser(authenticatedUser, false);
            await joinEquipe(Number(selectedTeamId));
          } finally {
            clearAuthenticatedUser();
          }
        }

        navigate('/login');
      } else if (result.status === 401 || result.status === 409 || result.status === 400) {
        setErrorMessage('Mince ! Cette adresse email est déjà utilisée. 😅');
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
          // ✨ Increased maxWidth from 600 to 660 to fit 5 large images per row perfectly
          maxWidth: 660,
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

          <Box sx={{ marginBottom: 3 }}>
            <Box
              sx={{
                height: '6px',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: barWidth,
                  backgroundColor: barColor,
                  transition: 'all 0.3s ease-in-out',
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: barColor,
                mt: 0.5,
                display: 'block',
                minHeight: '20px',
              }}
            >
              {strengthLabel}
            </Typography>

            {password.length > 0 && strengthScore < 5 && (
              <Box
                component="ul"
                sx={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  mt: 1,
                  pl: 2.5,
                  m: 0,
                }}
              >
                <li
                  style={{
                    color: password.length >= 8 ? '#22c55e' : 'inherit',
                  }}
                >
                  8 caractères minimum
                </li>
                <li
                  style={{
                    color: /[A-Z]/.test(password) ? '#22c55e' : 'inherit',
                  }}
                >
                  Une majuscule
                </li>
                <li
                  style={{
                    color: /[a-z]/.test(password) ? '#22c55e' : 'inherit',
                  }}
                >
                  Une minuscule
                </li>
                <li
                  style={{
                    color: /[0-9]/.test(password) ? '#22c55e' : 'inherit',
                  }}
                >
                  Un chiffre
                </li>
                <li
                  style={{
                    color: /[^a-zA-Z0-9]/.test(password)
                      ? '#22c55e'
                      : 'inherit',
                  }}
                >
                  Un caractère spécial
                </li>
              </Box>
            )}
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
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Équipe à rejoindre (optionnel)
              </InputLabel>
              <Select
                value={selectedTeamId}
                label="Équipe à rejoindre (optionnel)"
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loadingTeams}
                sx={{
                  color: 'white',
                  backgroundColor: '#2a3b55',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Aucune équipe</em>
                </MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingTeams && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={18} sx={{ color: '#e8822a' }} />
              </Box>
            )}
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
            
            {/* 📸 The slider section for images */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <IconButton
                onClick={handlePrevPage}
                disabled={imagePage === 0}
                sx={{
                  color: imagePage === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {'<'}
              </IconButton>

              <Box
                sx={{
                  // 🌟 Using CSS Grid to forcefully align exactly 5 images per row
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 1.5, // Small gap to ensure they all fit perfectly
                  justifyItems: 'center',
                  flex: 1,
                  mx: 1,
                }}
              >
                {displayedImages.map((img) => (
                  <Box
                    // We use the image name as the key, not the index, to help React with pagination
                    key={img} 
                    component="img"
                    src={img}
                    alt={`Avatar ${img}`}
                    onClick={() => setProfileImage(img)}
                    sx={{
                      width: 82, // EXACT 82px as requested
                      height: 82, // EXACT 82px as requested
                      borderRadius: 2,
                      cursor: 'pointer',
                      border:
                        profileImage === img
                          ? '3px solid #ffffff' // White border of 3px for the selected avatar
                          : '3px solid transparent', // Constant 3px border to avoid layout shift
                      // 🌟 The grey filter logic is right here:
                      opacity: profileImage === img ? 1 : 0.5,
                      transition: 'all 0.2s ease-in-out',
                      objectFit: 'cover',
                      // ✨ Removes the grey filter and scales up slightly on hover
                      '&:hover': { transform: 'scale(1.1)', opacity: 1 },
                    }}
                  />
                ))}
              </Box>

              <IconButton
                onClick={handleNextPage}
                disabled={(imagePage + 1) * imagesPerPage >= allImages.length}
                sx={{
                  color: (imagePage + 1) * imagesPerPage >= allImages.length ? 'rgba(255,255,255,0.2)' : 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {'>'}
              </IconButton>
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={strengthScore !== 5}
            sx={{
              backgroundColor:
                strengthScore === 5 ? '#e8822a' : 'rgba(255, 255, 255, 0.12)',
              color: strengthScore === 5 ? 'white' : 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor:
                  strengthScore === 5 ? '#c86e20' : 'rgba(255, 255, 255, 0.12)',
              },
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