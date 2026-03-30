import { useState, useEffect, useContext } from 'react';
import BackButton from '../../BoutonRetour';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Avatar,
  Alert,
  TextField, // ✨ NOUVEAU : On importe le champ de texte pour la recherche
  InputAdornment, // ✨ NOUVEAU : Pour mettre une petite icône dans la barre
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

import { UserContext } from '../../../contexts/UserContext';
import { AuthenticatedUser, UserContextType } from '../../../types';
import {
  banUser,
  fetchAllUsers,
  toggleAdminRole,
} from '../../../services/authService';

export default function AdminPage() {
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null); // ✨ NOUVEAU : La mémoire pour la barre de recherche

  const [searchTerm, setSearchTerm] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!authenticatedUser?.token) return;

    try {
      const data = await fetchAllUsers(authenticatedUser.token);
      setUsers(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Impossible de charger les joueurs.' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, [authenticatedUser?.token]);

  const handleToggleAdmin = async (
    email: string,
    isCurrentlyAdmin: boolean,
  ) => {
    if (!authenticatedUser?.token) return;

    try {
      await toggleAdminRole(email, isCurrentlyAdmin, authenticatedUser.token);
      setMessage({
        type: 'success',
        text: `Le rôle a été mis à jour avec succès !`,
      });
      loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Erreur de connexion au serveur.',
      });
    }
  }; // ✨ NOUVEAU : On filtre la liste des joueurs en fonction de ce qu'on tape dans la recherche !

  const openBanDialog = (email: string) => {
    setUserToBan(email);
    setBanDialogOpen(true);
  };

  const closeBanDialog = () => {
    setBanDialogOpen(false);
    setUserToBan(null);
  };

  const confirmBan = async () => {
    if (!userToBan || !authenticatedUser?.token) return;

    try {
      await banUser(userToBan, authenticatedUser.token);
      setMessage({
        type: 'success',
        text: `Le joueur a été banni définitivement.`,
      });
      loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Erreur de connexion au serveur.',
      });
    }

    closeBanDialog();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedUsers = filteredUsers.sort((a, b) => {
    const aBanned = a.banned ? 1 : 0;
    const bBanned = b.banned ? 1 : 0;
    if (aBanned !== bBanned) {
      return aBanned - bBanned;
    }

    const aAdmin = a.admin ? 1 : 0;
    const bAdmin = b.admin ? 1 : 0;
    if (aAdmin !== bAdmin) {
      return bAdmin - aAdmin;
    }

    const aTag = (a.tag || '').trim();
    const bTag = (b.tag || '').trim();
    const byTag = aTag.localeCompare(bTag, 'fr', {
      sensitivity: 'base',
    });
    if (byTag !== 0) {
      return byTag;
    }

    return (a.email || '').localeCompare(b.email || '', 'fr', {
      sensitivity: 'base',
    });
  });

  return (
    <Box sx={{ padding: 4, backgroundColor: '#080b14', minHeight: '100vh' }}>
      <BackButton />{' '}
      <Typography variant="h4" color="white" mb={4} textAlign="center">
        Gestion des Administrateurs 👑{' '}
      </Typography>{' '}
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 3, maxWidth: 800, margin: '0 auto 20px auto' }}
        >
          {message.text}{' '}
        </Alert>
      )}
      {/* ✨ NOUVEAU : La barre de recherche */}{' '}
      <Box sx={{ maxWidth: 1000, margin: '0 auto 20px auto' }}>
        {' '}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Chercher un joueur (par Tag ou Email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            backgroundColor: '#1a2540',
            borderRadius: 1,
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#2a3b55' },
              '&:hover fieldset': { borderColor: '#e8822a' },
              '&.Mui-focused fieldset': { borderColor: '#e8822a' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {' '}
                <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  🔍{' '}
                </Typography>{' '}
              </InputAdornment>
            ),
          }}
        />{' '}
      </Box>{' '}
      <TableContainer
        component={Paper}
        sx={{ maxWidth: 1000, margin: 'auto', backgroundColor: '#1a2540' }}
      >
        {' '}
        <Table>
          {' '}
          <TableHead sx={{ backgroundColor: '#2a3b55' }}>
            {' '}
            <TableRow>
              {' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                Avatar{' '}
              </TableCell>{' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                Tag / Pseudo{' '}
              </TableCell>{' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                Email{' '}
              </TableCell>{' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                Rôle{' '}
              </TableCell>{' '}
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}
              >
                Action{' '}
              </TableCell>{' '}
            </TableRow>{' '}
          </TableHead>{' '}
          <TableBody>
            {' '}
            {/* ✨ On utilise la liste filtrée au lieu de la liste complète */}{' '}
            {sortedUsers.map((user) => (
              <TableRow
                key={user.email}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {' '}
                <TableCell>
                  {' '}
                  <Avatar
                    src={`/${user.profileImage}`}
                    alt={user.tag}
                    sx={{ border: '2px solid #e8822a' }}
                  />{' '}
                </TableCell>{' '}
                <TableCell sx={{ color: 'white' }}>{user.tag}</TableCell>{' '}
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.email}{' '}
                </TableCell>{' '}
                <TableCell
                  sx={{
                    color: user.banned
                      ? '#ef4444'
                      : user.admin
                        ? '#e8822a'
                        : 'white',
                    fontWeight: user.admin || user.banned ? 'bold' : 'normal',
                  }}
                >
                  {user.banned
                    ? 'Joueur - Banni'
                    : user.admin
                      ? 'Administrateur'
                      : 'Joueur'}{' '}
                </TableCell>{' '}
                <TableCell sx={{ textAlign: 'center' }}>
                  {' '}
                  {/* ✨ NOUVEAU : On cache le bouton si c'est la personne connectée ! */}{' '}
                  {user.email === authenticatedUser?.email ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontStyle: 'italic',
                      }}
                    >
                      Vous-même{' '}
                    </Typography>
                  ) : user.banned ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ef4444',
                        fontStyle: 'italic',
                        fontWeight: 700,
                      }}
                    >
                      Compte banni
                    </Typography>
                  ) : (
                    <Box
                      sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}
                    >
                      <Button
                        variant={user.admin ? 'outlined' : 'contained'}
                        color={user.admin ? 'error' : 'primary'}
                        onClick={() =>
                          handleToggleAdmin(user.email, user.admin ?? false)
                        }
                        sx={{
                          backgroundColor: !user.admin
                            ? '#e8822a'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: !user.admin
                              ? '#c86e20'
                              : 'rgba(211, 47, 47, 0.1)',
                          },
                        }}
                      >
                        {user.admin ? 'Retirer Admin' : 'Nommer Admin'}
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => openBanDialog(user.email)}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Bannir
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog
        open={banDialogOpen}
        onClose={closeBanDialog}
        PaperProps={{
          sx: {
            backgroundColor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,0,0,0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ff5252', fontWeight: 'bold' }}>
          ⚠️ Confirmer le bannissement
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Êtes-vous sûr de vouloir bannir définitivement l'utilisateur{' '}
            <strong>{userToBan}</strong> ?
            <br />
            <br />
            Cette action est immédiate. Le compte reste en base mais ne pourra
            plus se connecter.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeBanDialog}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Annuler
          </Button>
          <Button onClick={confirmBan} variant="contained" color="error">
            Confirmer le Ban
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
