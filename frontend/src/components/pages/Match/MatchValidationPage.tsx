import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GavelIcon from '@mui/icons-material/Gavel';
import { getAuthenticatedUser } from '../../../utils/session';
import BackButton from '../../BackButton';

// We import the functions to get the team and check if the user is a manager
// Nous importons les fonctions pour obtenir l'équipe et vérifier si l'utilisateur est responsable
import {
  getUserTeam,
  getEquipeById,
  isCurrentUserResponsable,
} from '../../../services/teams';

/**
 * Page where team captains can validate or dispute a match score.
 * Page où les capitaines peuvent valider ou contester un score.
 */
export default function MatchValidationPage() {
  // Retrieves the match ID from the URL parameters (ex: /match/42/validation)
  // Récupère l'ID du match depuis l'URL
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = getAuthenticatedUser()?.token;

  // States for loading and errors
  // Variables pour gérer le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the match result data
  // Variable pour stocker le résultat du match
  const [matchResult, setMatchResult] = useState<any>(null);

  // States for team names (French default text)
  // Variables pour les noms des équipes
  const [team1Name, setTeam1Name] = useState<string>('Équipe 1');
  const [team2Name, setTeam2Name] = useState<string>('Équipe 2');

  // States for team profile images
  // Variables pour les images de profil des équipes
  const [team1Image, setTeam1Image] = useState<string | null>(null);
  const [team2Image, setTeam2Image] = useState<string | null>(null);

  // State for the current user's team ID
  // Variable pour l'ID de l'équipe de l'utilisateur actuel
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States to handle the rules: is the user a manager, and what is the match status?
  // Variables pour savoir si l'utilisateur est responsable et le statut du match
  const [isResponsable, setIsResponsable] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>('WAITING_VALIDATION');

  /**
   * Fixes the image URL to display it properly in the browser.
   * Répare l'URL de l'image pour l'afficher correctement dans le navigateur.
   * * @param avatar the raw image string from the database. (Le texte brut de l'image depuis la base de données)
   * @returns the corrected URL. (L'URL corrigée)
   */
  const normalizeAvatarUrl = (avatar?: string | null) => {
    // If there is no avatar, return undefined
    // S'il n'y a pas d'avatar, on renvoie indéfini
    if (!avatar) return undefined;

    // If it's already a full link, keep it
    // Si c'est déjà un lien complet, on le garde tel quel
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }

    // If it starts with a slash, keep it
    // Si ça commence par une barre oblique, on le garde
    if (avatar.startsWith('/')) {
      return avatar;
    }

    // Otherwise, add a slash at the beginning
    // Sinon, on ajoute une barre oblique au début
    return `/${avatar}`;
  };

  /**
   * Fetches all the necessary data when the page loads.
   * Récupère toutes les données nécessaires quand la page charge.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetches the user's team AND checks if the user is the manager
        // 1. Cherche l'équipe de l'utilisateur ET vérifie s'il est responsable
        const [team, managerStatus] = await Promise.all([
          getUserTeam(),
          isCurrentUserResponsable(),
        ]);

        if (team) setMyTeamId(team.id);
        setIsResponsable(managerStatus);

        // 2. Fetches the match score details
        // 2. Récupère les détails du score du match
        const response = await fetch(`/api/results/match/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Match introuvable.');

        const data = await response.json();
        setMatchResult(data);

        // 3. Fetches the match details to get team profiles and match status
        // 3. Récupère les infos du match pour avoir les profils des équipes et le statut
        try {
          const matchResponse = await fetch(`/api/matches/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();

            // Updates the current match status
            // Met à jour le statut actuel du match
            if (matchData.status) setMatchStatus(matchData.status);

            const t1Id = matchData.team1Id || matchData.team1?.id;
            const t2Id = matchData.team2Id || matchData.team2?.id;

            // Fetches profile for Team 1
            // Récupère le profil pour l'Équipe 1
            if (t1Id) {
              try {
                const team1Profile = await getEquipeById(t1Id.toString());
                setTeam1Name(team1Profile.name);
                setTeam1Image(team1Profile.profileImage || null);
              } catch (e) {
                if (matchData.team1Name) setTeam1Name(matchData.team1Name);
              }
            } else if (matchData.team1Name) {
              setTeam1Name(matchData.team1Name);
            }

            // Fetches profile for Team 2
            // Récupère le profil pour l'Équipe 2
            if (t2Id) {
              try {
                const team2Profile = await getEquipeById(t2Id.toString());
                setTeam2Name(team2Profile.name);
                setTeam2Image(team2Profile.profileImage || null);
              } catch (e) {
                if (matchData.team2Name) setTeam2Name(matchData.team2Name);
              }
            } else if (matchData.team2Name) {
              setTeam2Name(matchData.team2Name);
            }
          }
        } catch (e) {
          console.log('Impossible de charger les détails des équipes.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        // Stops the loading spinner
        // Arrête la roue de chargement
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  /**
   * Handles the validation or dispute of the score.
   * Gère la validation ou la contestation du score.
   * * @param isAccepted true to validate the score, false to dispute it. (Vrai pour valider, faux pour contester)
   */
  const handleValidate = async (isAccepted: boolean) => {
    if (!myTeamId) {
      setError('Erreur : Impossible de trouver votre équipe.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Sends the user's choice to the backend API
      // Envoie le choix de l'utilisateur à l'API (C'EST ICI QUE CA BLOQUE SANS LE JAVA !)
      const response = await fetch(
        `/api/results/match/${id}/validate/${myTeamId}?isAccepted=${isAccepted}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok)
        throw new Error("Impossible d'envoyer la réponse au serveur.");

      // Sets the success message based on the choice
      // Affiche le message de succès selon le choix
      setSuccessMessage(
        isAccepted
          ? 'Le score a été officiellement validé ! 🎉'
          : 'Le score a été contesté. Un administrateur va vérifier.',
      );

      // Redirects the user back to their team page after 3 seconds
      // Redirige l'utilisateur vers la page de son équipe après 3 secondes
      setTimeout(() => navigate('/maTeam'), 3000);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Shows a loading spinner while fetching data from the API
  // Montre une roue de chargement pendant qu'on récupère les données
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#040a1a',
        }}
      >
        <CircularProgress color="warning" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 5,
        background:
          'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)',
      }}
    >
      <Container maxWidth="md">
        <BackButton />

        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            borderRadius: 2,
            bgcolor: '#1a2540',
            borderTop: '4px solid #f59e0b',
            color: 'white',
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            textAlign="center"
            mb={1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <GavelIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
            Validation du Score
          </Typography>

          <Typography variant="body1" color="gray" textAlign="center" mb={4}>
            L'administrateur a encodé le résultat de ce match. Confirmez-vous ce
            score ?
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {matchResult && (
            <Box
              sx={{
                p: 4,
                bgcolor: '#111827',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-around"
                alignItems="center"
              >
                {/* TEAM 1 DISPLAY */}
                {/* AFFICHAGE EQUIPE 1 */}
                <Box
                  textAlign="center"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    src={normalizeAvatarUrl(team1Image)}
                    alt={team1Name}
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      border: '3px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Typography variant="h5" color="white" fontWeight="bold">
                    {team1Name}
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#e8822a"
                    fontWeight="bold"
                    mt={2}
                  >
                    {matchResult.scoreTeam1}
                  </Typography>
                </Box>

                <Typography variant="h4" color="gray" fontWeight="bold">
                  VS
                </Typography>

                {/* TEAM 2 DISPLAY */}
                {/* AFFICHAGE EQUIPE 2 */}
                <Box
                  textAlign="center"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    src={normalizeAvatarUrl(team2Image)}
                    alt={team2Name}
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      border: '3px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Typography variant="h5" color="white" fontWeight="bold">
                    {team2Name}
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#e8822a"
                    fontWeight="bold"
                    mt={2}
                  >
                    {matchResult.scoreTeam2}
                  </Typography>
                </Box>
              </Stack>

              {/* RULE 1: Only managers can see the buttons if the match is waiting for validation */}
              {/* REGLE 1 : Seuls les responsables voient les boutons si le match est en attente */}
              {!isResponsable &&
                matchStatus === 'WAITING_VALIDATION' &&
                !successMessage && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}
                  >
                    Seul le responsable de l'équipe peut valider ou contester le
                    score.
                  </Alert>
                )}

              {/* RULE 2: If the score was disputed once, it waits for definitive admin encoding */}
              {/* REGLE 2 : Si le score a été contesté, on attend la décision finale de l'admin */}
              {matchStatus === 'DISPUTED' && !successMessage && (
                <Alert
                  severity="info"
                  sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}
                >
                  Ce score a été contesté. Un administrateur vérifie la vidéo
                  pour encoder le résultat définitif.
                </Alert>
              )}

              {/* RULE 3: If the score is final, no more contestation is possible */}
              {/* REGLE 3 : Si le score est définitif, on ne peut plus rien faire (irrévocable) */}
              {(matchStatus === 'FINISHED' || matchStatus === 'COMPLETED') &&
                !successMessage && (
                  <Alert
                    severity="success"
                    sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}
                  >
                    Ce score est définitif et irrévocable. Aucune contestation
                    n'est plus possible.
                  </Alert>
                )}

              {/* Renders the action buttons ONLY if the user is a manager AND the status allows it */}
              {/* Affiche les boutons SEULEMENT si l'utilisateur est responsable ET que le statut l'autorise */}
              {matchStatus === 'WAITING_VALIDATION' &&
                isResponsable &&
                !successMessage && (
                  <Stack
                    direction="row"
                    spacing={3}
                    justifyContent="center"
                    mt={6}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      startIcon={<CancelIcon />}
                      disabled={isSubmitting}
                      onClick={() => handleValidate(false)}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                      }}
                    >
                      Contester
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<CheckCircleIcon />}
                      disabled={isSubmitting}
                      onClick={() => handleValidate(true)}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                      }}
                    >
                      Accepter le score
                    </Button>
                  </Stack>
                )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
