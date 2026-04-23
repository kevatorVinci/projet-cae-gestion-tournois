import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
} from '@mui/material';

import { Match, Tournoi } from '../../../types';

interface AdminMatchManagementProps {
  matches: Match[];
  tournaments: Tournoi[];
  token: string;
  onRefresh: () => void;
}

const AdminMatchManagement = ({
  matches,
  tournaments,
  token,
  onRefresh,
}: AdminMatchManagementProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState<number | ''>('');
  const [scoreTeam2, setScoreTeam2] = useState<number | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✨ CORRECTION ESLINT : On remplace "any" par un type précis
  const [previousResult, setPreviousResult] = useState<{
    validationStatusTeam1?: string;
    validationStatusTeam2?: string;
    scoreTeam1?: number;
    scoreTeam2?: number;
  } | null>(null);

  const handleOpenModal = async (match: Match) => {
    setSelectedMatch(match);
    setScoreTeam1('');
    setScoreTeam2('');
    setSubmitError(null);
    setPreviousResult(null);

    if (match.status === 'DISPUTED') {
      try {
        const response = await fetch(`/api/results/match/${match.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPreviousResult(data);
          setScoreTeam1(data.scoreTeam1);
          setScoreTeam2(data.scoreTeam2);
        }
      } catch (error) {
        console.error("Impossible de récupérer l'ancien score", error);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
    setSubmitError(null);
    setPreviousResult(null);
  };

  const isMatchInProgress = (scheduledDateTime: string, status: string) => {
    const matchDate = new Date(scheduledDateTime);
    const now = new Date();
    return matchDate <= now && status !== 'FINISHED' && status !== 'COMPLETED';
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;
    setSubmitError(null);

    if (scoreTeam1 === '' || scoreTeam2 === '') {
      setSubmitError('Veuillez entrer les deux scores avant de sauvegarder !');
      return;
    }

    const isDisputed = selectedMatch.status === 'DISPUTED';
    const url = isDisputed
      ? `/api/results/match/${selectedMatch.id}/definitive`
      : `/api/results/match/${selectedMatch.id}`;
    const method = isDisputed ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scoreTeam1: scoreTeam1,
          scoreTeam2: scoreTeam2,
          forfeitTeam1: false,
          forfeitTeam2: false,
          adminEncoderId: selectedMatch.adminResponsibleId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Code ${response.status} - ${errorText}`);
      }

      handleCloseModal();
      onRefresh();

      // ✨ CORRECTION ESLINT : On remplace "any" par "unknown"
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setSubmitError(`Impossible de contacter le Java : ${errorMessage}`);
    }
  };

  const inProgressMatches = matches.filter((match) =>
    isMatchInProgress(match.scheduledDateTime, match.status),
  );

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography
        variant="h5"
        color="white"
        mb={3}
        borderBottom="2px solid #2a3b55"
        pb={1}
        textAlign="left"
      >
        Matchs en cours ({inProgressMatches.length})
      </Typography>

      <Grid container spacing={2}>
        {inProgressMatches.map((match) => {
          const tournamentName =
            tournaments.find((t) => t.id === match.tournamentId)?.nom ||
            `Tournoi #${match.tournamentId}`;

          const isWaitingForCaptains = match.status === 'WAITING_VALIDATION';
          const isDisputed = match.status === 'DISPUTED';

          return (
            <Grid item xs={12} key={match.id}>
              <Card
                sx={{
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: isWaitingForCaptains
                    ? '4px solid #6b7280'
                    : isDisputed
                      ? '4px solid #ef4444'
                      : '4px solid #e8822a',
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box textAlign="left">
                    <Typography variant="h6" color="white" fontWeight={700}>
                      {match.team1Name || 'TBD'} VS {match.team2Name || 'TBD'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#60a5fa"
                      fontWeight="bold"
                      sx={{ mb: 0.5 }}
                    >
                      🏆 {tournamentName}
                    </Typography>
                    <Typography variant="body2" color="gray">
                      {new Date(match.scheduledDateTime).toLocaleString(
                        'fr-BE',
                      )}
                    </Typography>

                    <Chip
                      label={
                        isWaitingForCaptains
                          ? 'En attente'
                          : isDisputed
                            ? 'Contesté'
                            : 'En cours'
                      }
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor: isWaitingForCaptains
                          ? 'rgba(107,114,128,0.2)'
                          : isDisputed
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(232,130,42,0.1)',
                        color: isWaitingForCaptains
                          ? '#9ca3af'
                          : isDisputed
                            ? '#ef4444'
                            : '#e8822a',
                      }}
                    />
                  </Box>

                  {isWaitingForCaptains ? (
                    <Button
                      variant="contained"
                      disabled
                      sx={{
                        backgroundColor: '#374151 !important',
                        color: '#9ca3af !important',
                        cursor: 'not-allowed',
                      }}
                    >
                      En attente de validation
                    </Button>
                  ) : isDisputed ? (
                    <Button
                      variant="contained"
                      onClick={() => handleOpenModal(match)}
                      sx={{
                        backgroundColor: '#ef4444',
                        '&:hover': { backgroundColor: '#dc2626' },
                      }}
                    >
                      Ré-encoder (Contesté)
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleOpenModal(match)}
                      sx={{
                        backgroundColor: '#e8822a',
                        '&:hover': { backgroundColor: '#c86e20' },
                      }}
                    >
                      Encoder Résultat
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {inProgressMatches.length === 0 && (
          <Typography
            color="gray"
            sx={{ ml: 2, mt: 2, width: '100%', textAlign: 'left' }}
          >
            Aucun match n'est en cours pour le moment.
          </Typography>
        )}
      </Grid>

      <Dialog
        open={Boolean(selectedMatch)}
        onClose={handleCloseModal}
        PaperProps={{
          sx: { backgroundColor: '#1a2540', color: 'white', minWidth: '400px' },
        }}
      >
        <DialogTitle
          sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', mb: 2 }}
        >
          Encoder le résultat
        </DialogTitle>

        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          {previousResult && selectedMatch?.status === 'DISPUTED' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <strong>Score précédent refusé !</strong>
              <br />
              {previousResult.validationStatusTeam1 === 'REJECTED' && (
                <span>
                  🚨 <b>{selectedMatch.team1Name || "L'équipe 1"}</b> a contesté
                  le score.
                  <br />
                </span>
              )}
              {previousResult.validationStatusTeam2 === 'REJECTED' && (
                <span>
                  🚨 <b>{selectedMatch.team2Name || "L'équipe 2"}</b> a contesté
                  le score.
                </span>
              )}
              <br />
              <span style={{ fontSize: '0.85em' }}>
                Veuillez vérifier la vidéo et entrer le score final. Il sera
                irrévocable.
              </span>
            </Alert>
          )}

          {selectedMatch && (
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography variant="h6" color="#e8822a" gutterBottom>
                  {selectedMatch.team1Name || 'Équipe 1'}
                </Typography>
                <TextField
                  label="Score"
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={scoreTeam1}
                  onChange={(e) =>
                    setScoreTeam1(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  sx={{
                    mt: 2,
                    input: { color: 'white' },
                    label: { color: 'gray' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6" color="#e8822a" gutterBottom>
                  {selectedMatch.team2Name || 'Équipe 2'}
                </Typography>
                <TextField
                  label="Score"
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={scoreTeam2}
                  onChange={(e) =>
                    setScoreTeam2(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  sx={{
                    mt: 2,
                    input: { color: 'white' },
                    label: { color: 'gray' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            pt: 2,
            pb: 2,
            pr: 3,
          }}
        >
          <Button onClick={handleCloseModal} sx={{ color: 'gray' }}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmitResult}
            variant="contained"
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#388e3c' },
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMatchManagement;
