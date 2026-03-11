import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Check as AcceptIcon, Close as RefuseIcon } from '@mui/icons-material';

export function DemandesAdhesion() {
  // 1️⃣ Simulation des données (les candidatures en attente)
  const [demandes, setDemandes] = useState([
    { id: 1, tag: 'NoobSlayer', specialty: 'Tacticien', avatarSeed: 'Felix' },
    { id: 2, tag: 'EmmaL', specialty: 'Guérisseur', avatarSeed: 'Sara' },
  ]);

  // 2️⃣ États pour gérer la modale de refus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demandeRefusee, setDemandeRefusee] = useState<{
    id: number;
    tag: string;
  } | null>(null);
  const [motifRefus, setMotifRefus] = useState('');

  // 🟢 Action : Accepter un joueur
  const handleAccept = (id: number, tag: string) => {
    if (
      window.confirm(`Voulez-vous vraiment accepter ${tag} dans l'équipe ?`)
    ) {
      setDemandes(demandes.filter((d) => d.id !== id));
      // TODO: Appel API (POST /demands/{id}/accepter)
    }
  };

  // 🔴 Action : Ouvrir la modale pour refuser
  const handleOpenRefuseModal = (id: number, tag: string) => {
    setDemandeRefusee({ id, tag });
    setIsModalOpen(true);
  };

  // 🔴 Action : Confirmer le refus
  const handleConfirmRefusal = () => {
    if (!motifRefus.trim()) {
      alert('Le motif du refus est obligatoire.');
      return;
    }

    setDemandes(demandes.filter((d) => d.id !== demandeRefusee?.id));
    // TODO: Appel API (POST /demands/{id}/refuser + envoi du motif)

    setIsModalOpen(false);
    setMotifRefus('');
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        {/* --- EN-TÊTE DE LA PAGE --- */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              fontWeight={700}
              color="white"
              gutterBottom
            >
              Demandes d'adhésion
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Gérez les joueurs qui souhaitent rejoindre vos rangs.
            </Typography>
          </Box>
          <Chip
            label="Team : Dark Legion"
            sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 600 }}
          />
        </Box>

        {/* --- LISTE DES DEMANDES --- */}
        {demandes.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              bgcolor: '#1a2540',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Aucune candidature en attente pour le moment.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {demandes.map((demande) => (
              <Paper
                key={demande.id}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#1a2540',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                {/* Infos du joueur */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${demande.avatarSeed}`}
                    sx={{
                      width: 60,
                      height: 60,
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="white">
                      {demande.tag}
                    </Typography>
                    <Chip
                      label={demande.specialty}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        fontSize: 12,
                      }}
                    />
                  </Box>
                </Stack>

                {/* Boutons d'action */}
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AcceptIcon />}
                    onClick={() => handleAccept(demande.id, demande.tag)}
                  >
                    Accepter
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RefuseIcon />}
                    onClick={() =>
                      handleOpenRefuseModal(demande.id, demande.tag)
                    }
                  >
                    Refuser
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>

      {/* --- MODALE DE REFUS --- */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, bgcolor: '#1a2540', color: 'white' }}
        >
          Refuser la candidature
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a2540', color: 'white', pt: 2 }}>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Veuillez indiquer le motif du refus pour{' '}
            <strong>{demandeRefusee?.tag}</strong>. Ce motif lui sera
            communiqué.
          </DialogContentText>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Ex: Notre équipe est actuellement complète..."
            value={motifRefus}
            onChange={(e) => setMotifRefus(e.target.value)}
            sx={{
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': { color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a2540', p: 2 }}>
          <Button
            onClick={() => setIsModalOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmRefusal}
            variant="contained"
            color="error"
          >
            Confirmer le refus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
