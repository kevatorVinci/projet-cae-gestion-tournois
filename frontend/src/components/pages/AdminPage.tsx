import { useState, useEffect, useContext } from 'react';
import BackButton from '../../components/BoutonRetour';
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
} from '@mui/material';

import { UserContext } from '../../contexts/UserContext';
import { AuthenticatedUser, UserContextType } from '../../types';

export default function AdminPage() {
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null); // ✨ NOUVEAU : La mémoire pour la barre de recherche

  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auths/users', {
        headers: {
          Authorization: authenticatedUser?.token || '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Impossible de charger les joueurs.' });
    }
  };

  useEffect(() => {
    fetchUsers(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAdmin = async (
    email: string,
    isCurrentlyAdmin: boolean,
  ) => {
    const url = isCurrentlyAdmin
      ? '/api/auths/removeAdmin'
      : '/api/auths/addAdmin';

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: authenticatedUser?.token || '',
        },
        body: email,
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Le rôle a été mis à jour avec succès !`,
        });
        fetchUsers();
      } else {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la modification. Vérifiez le serveur Java.',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    }
  }; // ✨ NOUVEAU : On filtre la liste des joueurs en fonction de ce qu'on tape dans la recherche !

  const filteredUsers = users.filter(
    (user) =>
      user.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Box sx={{ padding: 4, backgroundColor: '#080b14', minHeight: '100vh' }}>
            <BackButton />     {' '}
      <Typography variant="h4" color="white" mb={4} textAlign="center">
                Gestion des Administrateurs 👑      {' '}
      </Typography>
           {' '}
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 3, maxWidth: 800, margin: '0 auto 20px auto' }}
        >
                    {message.text}       {' '}
        </Alert>
      )}
            {/* ✨ NOUVEAU : La barre de recherche */}     {' '}
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
                                    🔍                {' '}
                </Typography>
                             {' '}
              </InputAdornment>
            ),
          }}
        />
             {' '}
      </Box>
           {' '}
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
                                Avatar              {' '}
              </TableCell>
                           {' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                Tag / Pseudo              {' '}
              </TableCell>
                           {' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                Email              {' '}
              </TableCell>
                           {' '}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                Rôle              {' '}
              </TableCell>
                           {' '}
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}
              >
                                Action              {' '}
              </TableCell>
                         {' '}
            </TableRow>
                     {' '}
          </TableHead>
                   {' '}
          <TableBody>
                       {' '}
            {/* ✨ On utilise la liste filtrée au lieu de la liste complète */} 
                     {' '}
            {filteredUsers.map((user) => (
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
                  />
                                 {' '}
                </TableCell>
                               {' '}
                <TableCell sx={{ color: 'white' }}>{user.tag}</TableCell>       
                       {' '}
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {user.email}               {' '}
                </TableCell>
                               {' '}
                <TableCell
                  sx={{
                    color: user.admin ? '#e8822a' : 'white',
                    fontWeight: user.admin ? 'bold' : 'normal',
                  }}
                >
                                    {user.admin ? 'Administrateur' : 'Joueur'} 
                               {' '}
                </TableCell>
                               {' '}
                <TableCell sx={{ textAlign: 'center' }}>
                                   {' '}
                  {/* ✨ NOUVEAU : On cache le bouton si c'est la personne connectée ! */}
                                   {' '}
                  {user.email === authenticatedUser?.email ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontStyle: 'italic',
                      }}
                    >
                                            Vous-même                    {' '}
                    </Typography>
                  ) : (
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
                                           {' '}
                      {user.admin ? 'Retirer Admin' : 'Nommer Admin'}           
                             {' '}
                    </Button>
                  )}
                                 {' '}
                </TableCell>
                             {' '}
              </TableRow>
            ))}
                     {' '}
          </TableBody>
                 {' '}
        </Table>
             {' '}
      </TableContainer>
         {' '}
    </Box>
  );
}
