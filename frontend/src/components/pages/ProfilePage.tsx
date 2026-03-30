import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BoutonRetour';
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

export default function ProfilePage() {
  const { authenticatedUser, updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State to track the current page of avatars (starts at 0)
  const [imagePage, setImagePage] = useState(0);

  /**
   * Toggles the visibility of the password fields
   */
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const [specialty, setSpecialty] = useState(
    authenticatedUser?.specialty?.toLowerCase() || '',
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

  // The complete list of 40 avatars, matching the registration page
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
   * Calculate the strength of the new password
   * @param pwd The password string to evaluate
   * @returns The strength score out of 5
   */
  // 🧠 1. Calculate the strength of the new password
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

  const strengthScore = calculateStrength(newPassword);

  // 🎨 2. Determine the colors of the gauge based on the score
  let barColor = 'transparent';
  let strengthLabel = '';
  let barWidth = '0%';

  if (newPassword.length > 0) {
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

  // 🛡️ 3. Button blocking logic
  // Checks if the user is currently trying to type a new password
  const isChangingPassword = newPassword.length > 0;
  
  // If we want to change the password, the score must be 5 AND the confirmation must match
  const isPasswordValid =
    strengthScore === 5 && newPassword === confirmPassword;
    
  // We can save IF: we DO NOT change the password OR we change it correctly (with the old one typed)
  const canSubmit =
    !isChangingPassword ||
    (isChangingPassword && isPasswordValid && oldPassword.length > 0);

  /**
   * Handles the form submission when the user clicks save
   * @param e The form event
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas !',
      });
      return;
    }

    // Creates the base object with user visual info
    // We use 'any' type here to allow adding properties conditionally
    const updatedInfo: any = {
      email: authenticatedUser?.email,
      specialty: specialty,
      profileImage: profileImage,
    };

    // ONLY adds passwords to the request if the user is changing them
    // This prevents the Java server from returning an error for empty passwords
    if (isChangingPassword) {
      updatedInfo.oldPassword = oldPassword;
      updatedInfo.newPassword = newPassword;
    }

    try {
      // Sends the update request to the backend
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
          // Updates the local context with the new visual info
          updateUser({ specialty: specialty, profileImage: profileImage });
        }
        // Clears the password fields after a successful update
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirects the user to the profile page
        navigate('/profil');
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
          // ✨ Increased maxWidth from 600 to 660 to fit 5 large images per row
          maxWidth: 660, 
        }}
      >
        <BackButton />
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

          <Grid container spacing={2} sx={{ mb: 1 }}>
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

          {/* 📊 4. The Gauge (displayed only if the user starts typing a new password) */}
          {newPassword.length > 0 && (
            <Box sx={{ mb: 4, mt: 1 }}>
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
                sx={{ color: barColor, mt: 0.5, display: 'block' }}
              >
                {strengthLabel}
                {strengthScore === 5 &&
                  newPassword !== confirmPassword &&
                  ' (Les mots de passe ne correspondent pas)'}
              </Typography>

              {strengthScore < 5 && (
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
                      color: newPassword.length >= 8 ? '#22c55e' : 'inherit',
                    }}
                  >
                    8 caractères minimum
                  </li>
                  <li
                    style={{
                      color: /[A-Z]/.test(newPassword) ? '#22c55e' : 'inherit',
                    }}
                  >
                    Une majuscule
                  </li>
                  <li
                    style={{
                      color: /[a-z]/.test(newPassword) ? '#22c55e' : 'inherit',
                    }}
                  >
                    Une minuscule
                  </li>
                  <li
                    style={{
                      color: /[0-9]/.test(newPassword) ? '#22c55e' : 'inherit',
                    }}
                  >
                    Un chiffre
                  </li>
                  <li
                    style={{
                      color: /[^a-zA-Z0-9]/.test(newPassword)
                        ? '#22c55e'
                        : 'inherit',
                    }}
                  >
                    Un caractère spécial
                  </li>
                </Box>
              )}
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit} // 🛑 Smartly blocks the button
            sx={{
              backgroundColor: canSubmit
                ? '#e8822a'
                : 'rgba(255, 255, 255, 0.12)',
              color: canSubmit ? 'white' : 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: canSubmit
                  ? '#c86e20'
                  : 'rgba(255, 255, 255, 0.12)',
              },
              padding: 1.5,
              fontSize: '1.1rem',
              mt: newPassword.length > 0 ? 0 : 3, // Adjusts the margin if the gauge is not displayed
            }}
          >
            Sauvegarder les modifications
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
