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

import {
  getUserTeam,
  getEquipeById,
  isCurrentUserResponsable,
} from '../../../services/teams';

/**
 * Page où les capitaines peuvent valider ou contester un score.
 *
 * @return {JSX.Element} Le composant de la page de validation.
 */
export default function MatchValidationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = getAuthenticatedUser()?.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✨ CORRECTION ESLINT : Plus de "any"
  const [matchResult, setMatchResult] = useState<{
    scoreTeam1?: number;
    scoreTeam2?: number;
  } | null>(null);

  const [team1Name, setTeam1Name] = useState<string>('Équipe 1');
  const [team2Name, setTeam2Name] = useState<string>('Équipe 2');

  const [team1Image, setTeam1Image] = useState<string | null>(null);
  const [team2Image, setTeam2Image] = useState<string | null>(null);

  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isResponsable, setIsResponsable] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>('WAITING_VALIDATION');

  /**
   * Répare l'URL de l'image pour l'afficher correctement dans le navigateur.
   *
   * @param {string | null | undefined} avatar Le texte brut de l'image depuis la base de données.
   * @return {string | undefined} L'URL corrigée.
   */
  const normalizeAvatarUrl = (avatar?: string | null) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return avatar;
    }
    return `/${avatar}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [team, managerStatus] = await Promise.all([
          getUserTeam(),
          isCurrentUserResponsable(),
        ]);

        if (team) setMyTeamId(team.id);
        setIsResponsable(managerStatus);

        const response = await fetch(`/api/results/match/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Match introuvable.');

        const data = await response.json();
        setMatchResult(data);

        try {
          const matchResponse = await fetch(`/api/matches/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();

            if (matchData.status) setMatchStatus(matchData.status);

            const t1Id = matchData.team1Id || matchData.team1?.id;
            const t2Id = matchData.team2Id || matchData.team2?.id;

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

        // ✨ CORRECTION ESLINT
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  /**
   * Gère la validation ou la contestation du score.
   *
   * @param {boolean} isAccepted Vrai pour valider, faux pour contester.
   * @return {Promise<void>} Une promesse vide.
   */
  const handleValidate = async (isAccepted: boolean) => {
    if (!myTeamId) {
      setError('Erreur : Impossible de trouver votre équipe.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/results/match/${id}/validate?teamId=${myTeamId}&accepted=${isAccepted}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok)
        throw new Error("Impossible d'envoyer la réponse au serveur.");

      setSuccessMessage(
        isAccepted
          ? 'Le score a été officiellement validé ! 🎉'
          : 'Le score a été contesté. Un administrateur va vérifier.',
      );

      setTimeout(() => navigate('/maTeam'), 3000);

      // ✨ CORRECTION ESLINT
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsSubmitting(false);
    }
  };

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

              {matchStatus === 'DISPUTED' && !successMessage && (
                <Alert
                  severity="info"
                  sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}
                >
                  Ce score a été contesté. Un administrateur vérifie la vidéo
                  pour encoder le résultat définitif.
                </Alert>
              )}

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
