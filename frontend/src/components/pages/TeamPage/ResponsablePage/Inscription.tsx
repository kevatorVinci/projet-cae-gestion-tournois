import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../BoutonRetour';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  EmojiEvents,
  AddCircleOutline,
  CancelOutlined,
} from '@mui/icons-material';
import {
  fetchAcceptedTournamentRegistrations,
  fetchPublicTournaments,
  fetchTeamRegistrations,
  registerTeamToTournament,
  TeamRegistrationItem,
  unregisterTeam,
} from '../../../../services/tournois';
import { getUserTeam } from '../../../../services/teams';
import { getAuthenticatedUser } from '../../../../utils/session';

interface Tournoi {
  id: number;
  nom: string;
  etat: string;
  dateDebut: string;
  nombresParticipantsMax?: number;
}

interface Inscription {
  tournoiId: number;
  equipeId: number;
  dateInscription?: string;
  tournoi: Tournoi;
}

const toInscriptions = (
  registrations: TeamRegistrationItem[],
  tournamentsById: Map<number, Tournoi>,
): Inscription[] => {
  return registrations.reduce<Inscription[]>((acc, item) => {
    const tournoi = item.tournoi ?? tournamentsById.get(item.tournoiId);
    if (!tournoi) {
      return acc;
    }

    acc.push({
      tournoiId: item.tournoiId,
      equipeId: item.equipeId,
      dateInscription: item.dateInscription,
      tournoi,
    });

    return acc;
  }, []);
};

export function TournoisResponsable() {
  const navigate = useNavigate();
  const token = getAuthenticatedUser()?.token;

  const [equipeId, setEquipeId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('Votre equipe');

  const [mesInscriptions, setMesInscriptions] = useState<Inscription[]>([]);
  const [tournoisOuverts, setTournoisOuverts] = useState<Tournoi[]>([]);
  const [tournoisClotures, setTournoisClotures] = useState<Tournoi[]>([]);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false);
  const [tournoiCible, setTournoiCible] = useState<Tournoi | null>(null);
  const [inscriptionCible, setInscriptionCible] = useState<Inscription | null>(
    null,
  );
  const [registerWarningMessage, setRegisterWarningMessage] = useState<
    string | null
  >(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setErrorMessage('Session expiree. Veuillez vous reconnecter.');
      setPageLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      setPageLoading(true);

      const [allTournaments, myTeam] = await Promise.all([
        fetchPublicTournaments(),
        getUserTeam(),
      ]);

      if (!myTeam) {
        setMesInscriptions([]);
        setTournoisOuverts([]);
        setTournoisClotures([]);
        setTeamName('Votre equipe');
        setEquipeId(null);
        return;
      }

      setTeamName(myTeam.name);
      setEquipeId(myTeam.id);

      const inscriptionsRaw = await fetchTeamRegistrations(myTeam.id, token);

      const tournamentsById = new Map<number, Tournoi>(
        (allTournaments as Tournoi[]).map((t) => [t.id, t]),
      );

      const inscriptions = toInscriptions(inscriptionsRaw, tournamentsById);
      setMesInscriptions(inscriptions);

      const mesTournoisIds = new Set(inscriptions.map((i) => i.tournoi.id));
      const ouverts: Tournoi[] = [];
      const clotures: Tournoi[] = [];

      for (const t of allTournaments as Tournoi[]) {
        if (mesTournoisIds.has(t.id)) continue;

        if (t.etat === 'OUVERT') {
          ouverts.push(t);
        } else {
          clotures.push(t);
        }
      }

      setTournoisOuverts(ouverts);
      setTournoisClotures(clotures);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erreur de chargement.',
      );
    } finally {
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async () => {
    if (!tournoiCible || !equipeId || !token) return;
    try {
      setErrorMessage(null);
      setFeedback(null);
      setActionLoading(tournoiCible.id);

      await registerTeamToTournament(tournoiCible.id, equipeId, token);

      setFeedback(`Inscription reussie au tournoi : ${tournoiCible.nom} !`);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur d'inscription.",
      );
    } finally {
      setActionLoading(null);
      setIsRegisterModalOpen(false);
      setTournoiCible(null);
    }
  };

  const handleUnregister = async () => {
    if (!inscriptionCible || !token || !equipeId) return;

    try {
      setErrorMessage(null);
      setFeedback(null);
      setActionLoading(inscriptionCible.tournoiId);

      await unregisterTeam(inscriptionCible.tournoiId, equipeId, token);

      setFeedback(
        `Vous etes desinscrit du tournoi : ${inscriptionCible.tournoi.nom}.`,
      );
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Impossible d'annuler.",
      );
    } finally {
      setActionLoading(null);
      setIsUnregisterModalOpen(false);
      setInscriptionCible(null);
    }
  };

  const renderTournoiCard = (tournoi: Tournoi, actionButton: ReactNode) => (
    <Paper
      key={tournoi.id}
      onClick={() => navigate(`/tournois/${tournoi.id}`)}
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
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#e8822a',
        },
      }}
    >
      <Box>
        <Typography variant="h6" fontWeight={700} color="white">
          {tournoi.nom}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip
            label={tournoi.etat}
            size="small"
            sx={{
              bgcolor: tournoi.etat === 'OUVERT' ? '#22c55e' : '#f97316',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={`Debut: ${new Date(tournoi.dateDebut).toLocaleDateString('fr-BE')}`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
          />
        </Stack>
      </Box>
      <Box onClick={(event) => event.stopPropagation()}>{actionButton}</Box>
    </Paper>
  );

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
              Gestion des Tournois
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Inscrivez votre equipe aux competitions a venir.
            </Typography>
          </Box>
          <Chip
            label={`Team : ${teamName}`}
            sx={{ bgcolor: '#e8822a', color: 'white', fontWeight: 600 }}
          />
        </Box>

        {pageLoading && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Chargement des tournois...
          </Alert>
        )}

        {!pageLoading && (
          <Stack spacing={5}>
            <Box>
              <Typography
                variant="h5"
                color="white"
                fontWeight={600}
                mb={2}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <EmojiEvents sx={{ color: '#eab308' }} /> Mes Inscriptions
              </Typography>
              {mesInscriptions.length === 0 ? (
                <Alert
                  severity="info"
                  sx={{
                    bgcolor: '#1a2540',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Votre equipe ne participe a aucun tournoi pour le moment.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {mesInscriptions.map((inscription) =>
                    renderTournoiCard(
                      inscription.tournoi,
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlined />}
                        disabled={
                          actionLoading === inscription.tournoiId ||
                          inscription.tournoi.etat !== 'OUVERT'
                        }
                        onClick={() => {
                          setInscriptionCible(inscription);
                          setIsUnregisterModalOpen(true);
                        }}
                      >
                        Se desinscrire
                      </Button>,
                    ),
                  )}
                </Stack>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <Box>
              <Typography variant="h5" color="white" fontWeight={600} mb={2}>
                Tournois disponibles
              </Typography>
              {tournoisOuverts.length === 0 ? (
                <Alert
                  severity="info"
                  sx={{
                    bgcolor: '#1a2540',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Aucun nouveau tournoi n'est ouvert aux inscriptions.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {tournoisOuverts.map((tournoi) =>
                    renderTournoiCard(
                      tournoi,
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<AddCircleOutline />}
                        disabled={actionLoading === tournoi.id}
                        onClick={() => {
                          setTournoiCible(tournoi);
                          setRegisterWarningMessage(null);

                          if (tournoi.nombresParticipantsMax) {
                            fetchAcceptedTournamentRegistrations(tournoi.id)
                              .then((accepted) => {
                                const remainingSlots =
                                  tournoi.nombresParticipantsMax! -
                                  accepted.length;

                                if (remainingSlots <= 1) {
                                  setRegisterWarningMessage(
                                    "Attention: c'est la derniere place. Cette inscription va cloturer le tournoi automatiquement.",
                                  );
                                } else {
                                  setRegisterWarningMessage(
                                    `Attention: il reste ${remainingSlots} place(s). Si le tournoi devient plein, il sera cloture automatiquement.`,
                                  );
                                }
                              })
                              .catch(() => {
                                setRegisterWarningMessage(
                                  'Attention: si le tournoi devient plein, il sera cloture automatiquement.',
                                );
                              });
                          } else {
                            setRegisterWarningMessage(
                              'Attention: cette inscription peut impacter le statut du tournoi.',
                            );
                          }

                          setIsRegisterModalOpen(true);
                        }}
                      >
                        S'inscrire
                      </Button>,
                    ),
                  )}
                </Stack>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <Box>
              <Typography variant="h5" color="white" fontWeight={600} mb={2}>
                Tournois clotures ou termines
              </Typography>
              {tournoisClotures.length === 0 ? (
                <Typography color="rgba(255,255,255,0.5)">
                  Aucun historique disponible.
                </Typography>
              ) : (
                <Stack spacing={2} sx={{ opacity: 0.7 }}>
                  {tournoisClotures.map((tournoi) =>
                    renderTournoiCard(
                      tournoi,
                      <Chip
                        label="Inscriptions fermees"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.15)',
                          color: 'white',
                        }}
                      />,
                    ),
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Container>

      <Dialog
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, bgcolor: '#1a2540', color: 'white' }}
        >
          Confirmer l'inscription
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a2540', color: 'white', pt: 2 }}>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Voulez-vous inscrire votre equipe au tournoi{' '}
            <strong>{tournoiCible?.nom}</strong> ?
          </DialogContentText>
          {registerWarningMessage && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {registerWarningMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a2540', p: 2 }}>
          <Button
            onClick={() => setIsRegisterModalOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Annuler
          </Button>
          <Button onClick={handleRegister} variant="contained" color="success">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isUnregisterModalOpen}
        onClose={() => setIsUnregisterModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, bgcolor: '#1a2540', color: 'white' }}
        >
          Annuler l'inscription
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a2540', color: 'white', pt: 2 }}>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Voulez-vous vraiment desinscrire votre equipe du tournoi{' '}
            <strong>{inscriptionCible?.tournoi.nom}</strong> ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a2540', p: 2 }}>
          <Button
            onClick={() => setIsUnregisterModalOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Retour
          </Button>
          <Button onClick={handleUnregister} variant="contained" color="error">
            Se desinscrire
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
