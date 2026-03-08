import React, { useState } from 'react';
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
} from '@mui/material';

export default function RegisterPage() {
  // Le "navigateur" nous permet de changer de page à la fin de l'inscription
  const navigate = useNavigate();

  // --- On prépare les "boîtes" (états) pour stocker ce que l'utilisateur tape ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Pour afficher une erreur en rouge

  // Les listes demandées par le client pour les choix
  const specialties = [
    'architecte',
    'exécuteur',
    'tacticien',
    'gardien',
    'catalyseur',
    'perturbateur',
    'guérisseur',
  ]; //
  const defaultImages = [
    '/images/avatar1.png',
    '/images/avatar2.png',
    '/images/avatar3.png',
  ]; // [cite: 29]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // On bloque le rechargement de la page
    setErrorMessage(''); // On efface les anciennes erreurs

    // 1. On prépare le colis (les données) à envoyer à notre serveur IntelliJ
    const newUser = {
      email: email,
      password: password,
      tag: tag,
      specialty: specialty,
      profileImage: profileImage,
      team: null, // Pas de team au début comme on en a parlé !
    };

    try {
      // 2. On envoie le colis au serveur (au guichet AuthController qu'on a créé)
      const response = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser), // On transforme notre colis en texte (JSON)
      });

      // 3. On regarde la réponse du serveur
      if (response.ok) {
        // L'inscription a réussi ! On redirige vers la page de connexion comme demandé [cite: 305]
        navigate('/login');
      } else if (response.status === 409) {
        // Erreur 409 = Conflit (Email déjà pris)
        setErrorMessage('Cette adresse email est déjà utilisée.'); // [cite: 304]
      } else {
        // Autre erreur (ex: 400 Bad Request)
        setErrorMessage(
          "Erreur lors de l'inscription. Vérifiez vos informations.",
        ); // [cite: 304]
      }
    } catch (error) {
      setErrorMessage('Impossible de se connecter au serveur.');
    }
  };

  // --- Le rendu visuel de la page (HTML avec MUI) ---
  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: 'auto',
        mt: 5,
        padding: 3,
        boxShadow: 2,
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Inscription à Vinci Arena
      </Typography>

      {/* Si errorMessage n'est pas vide, on affiche une alerte rouge */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleRegister}>
        {/* Champ Email */}
        <TextField
          label="Adresse Email"
          fullWidth
          margin="normal"
          required
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />

        {/* Champ Mot de passe */}
        <TextField
          label="Mot de passe"
          type="password"
          fullWidth
          margin="normal"
          required
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />

        {/* Champ Tag (Pseudo) */}
        <TextField
          label="Tag (Pseudo en jeu)"
          fullWidth
          margin="normal"
          required
          value={tag}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTag(e.target.value)
          }
        />

        {/* Liste déroulante pour la Spécialité */}
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Spécialité</InputLabel>
          <Select
            value={specialty}
            label="Spécialité"
            onChange={(e: SelectChangeEvent<string>) =>
              setSpecialty(e.target.value)
            }
          >
            {specialties.map((spec) => (
              <MenuItem key={spec} value={spec}>
                {spec}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Liste déroulante pour l'Image de Profil */}
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Image de profil</InputLabel>
          <Select
            value={profileImage}
            label="Image de profil"
            onChange={(e: SelectChangeEvent<string>) =>
              setProfileImage(e.target.value)
            }
          >
            {defaultImages.map((img) => (
              <MenuItem key={img} value={img}>
                Image {img.replace('/images/avatar', '').replace('.png', '')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Bouton pour valider */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          S'inscrire
        </Button>
      </Box>
    </Box>
  );
}
