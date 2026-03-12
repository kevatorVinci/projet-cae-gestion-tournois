import { useEffect, useState } from 'react';
import BackButton from '../../../../components/BoutonRetour';
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
import {
  accepterDemande,
  getDemandesEnAttenteResponsable,
  refuserDemande,
} from '../../../../services/demande';

type PendingDemandeView = {
  id: number;
  tag: string;
  specialty: string;
  avatarUrl?: string;
  equipeName?: string;
};

const normalizeAvatarUrl = (avatar?: string): string | undefined => {
  if (!avatar) return undefined;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  if (avatar.startsWith('/')) {
    return avatar;
  }
  return `/${avatar}`;
};

export function DemandesAdhesion() {
  const [demandes, setDemandes] = useState<PendingDemandeView[]>([]);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [demandeAcceptee, setDemandeAcceptee] = useState<{
    id: number;
    tag: string;
  } | null>(null);

  // 2️⃣ États pour gérer la modale de refus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demandeRefusee, setDemandeRefusee] = useState<{
    id: number;
    tag: string;
  } | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [teamName, setTeamName] = useState('Votre équipe');

  useEffect(() => {
    const loadDemandes = async () => {
      try {
        setErrorMessage(null);
        const rawDemandes = await getDemandesEnAttenteResponsable();
        const mappedDemandes: PendingDemandeView[] = rawDemandes.map((d) => ({
          id: d.idDemande,
          tag: d.membreTag ?? d.membreEmail ?? `Membre #${d.membreId}`,
          specialty: d.membreSpecialty ?? 'Inconnue',
          avatarUrl: normalizeAvatarUrl(d.membreProfileImageUrl),
          equipeName: d.equipeName,
        }));

        setDemandes(mappedDemandes);
        if (rawDemandes.length > 0 && rawDemandes[0].equipeName) {
          setTeamName(rawDemandes[0].equipeName);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Impossible de charger les demandes en attente.';
        setErrorMessage(msg);
      } finally {
        setPageLoading(false);
      }
    };

    loadDemandes();
  }, []);

  // 🟢 Action : Accepter un joueur
  const handleOpenAcceptModal = (id: number, tag: string) => {
    setDemandeAcceptee({ id, tag });
    setIsAcceptModalOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!demandeAcceptee) {
      return;
    }

    try {
      setErrorMessage(null);
      setFeedback(null);
      setActionLoading(demandeAcceptee.id);
      await accepterDemande(demandeAcceptee.id);
      setDemandes((prev) => prev.filter((d) => d.id !== demandeAcceptee.id));
      setFeedback(`La candidature de ${demandeAcceptee.tag} a été acceptée.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible d'accepter la demande.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(null);
      setIsAcceptModalOpen(false);
      setDemandeAcceptee(null);
    }
  };

  // 🔴 Action : Ouvrir la modale pour refuser
  const handleOpenRefuseModal = (id: number, tag: string) => {
    setDemandeRefusee({ id, tag });
    setIsModalOpen(true);
  };

  // 🔴 Action : Confirmer le refus
  const handleConfirmRefusal = async () => {
    if (!motifRefus.trim()) {
      alert('Le motif du refus est obligatoire.');
      return;
    }

    if (!demandeRefusee) {
      return;
    }

    try {
      setErrorMessage(null);
      setFeedback(null);
      setActionLoading(demandeRefusee.id);
      await refuserDemande(demandeRefusee.id, motifRefus.trim());
      setDemandes((prev) => prev.filter((d) => d.id !== demandeRefusee.id));
      setFeedback(`La candidature de ${demandeRefusee.tag} a été refusée.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Impossible de refuser la demande.';
      setErrorMessage(msg);
    } finally {
      setActionLoading(null);
      setIsModalOpen(false);
      setMotifRefus('');
      setDemandeRefusee(null);
    }
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
        {feedback && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {feedback}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

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
            <BackButton />
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
            label={`Team : ${teamName}`}
            sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 600 }}
          />
        </Box>

        {pageLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Chargement des demandes en attente...
          </Alert>
        )}

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
                    src={demande.avatarUrl}
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
                    disabled={actionLoading === demande.id}
                    onClick={() =>
                      handleOpenAcceptModal(demande.id, demande.tag)
                    }
                  >
                    Accepter
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RefuseIcon />}
                    disabled={actionLoading === demande.id}
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

      <Dialog
        open={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, bgcolor: '#1a2540', color: 'white' }}
        >
          Accepter la candidature
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a2540', color: 'white', pt: 2 }}>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Voulez-vous vraiment accepter{' '}
            <strong>{demandeAcceptee?.tag}</strong> dans l&apos;équipe ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a2540', p: 2 }}>
          <Button
            onClick={() => setIsAcceptModalOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmAccept}
            variant="contained"
            color="success"
            disabled={!demandeAcceptee}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

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
