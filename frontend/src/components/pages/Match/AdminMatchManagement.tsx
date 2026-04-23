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
  Avatar
} from '@mui/material';

import { Match, Tournoi } from '../../../types';
import { getEquipeById } from '../../../services/teams';
import { fetchMatchSelections, MatchPlayerSelection } from '../../../services/tournaments';

interface AdminMatchManagementProps {
  matches: Match[];
  tournaments: Tournoi[];
  token: string;
  onRefresh: () => void;
}

const AdminMatchManagement = ({ matches, tournaments, token, onRefresh }: AdminMatchManagementProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState<number | ''>('');
  const [scoreTeam2, setScoreTeam2] = useState<number | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previousResult, setPreviousResult] = useState<{ validationStatusTeam1?: string, validationStatusTeam2?: string, scoreTeam1?: number, scoreTeam2?: number } | null>(null);

  const [team1Image, setTeam1Image] = useState<string | null>(null);
  const [team2Image, setTeam2Image] = useState<string | null>(null);
  const [selections, setSelections] = useState<MatchPlayerSelection[]>([]);

  const normalizeAvatarUrl = (avatar?: string | null) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    if (avatar.startsWith('/')) return avatar;
    return `/${avatar}`;
  };

  const handleOpenModal = async (match: Match) => {
    setSelectedMatch(match);
    setScoreTeam1('');
    setScoreTeam2('');
    setSubmitError(null); 
    setPreviousResult(null);
    setTeam1Image(null);
    setTeam2Image(null);
    setSelections([]); 

    const t1Id = Number(match.team1Id || (match as any).team1?.id);
    if (t1Id) {
      getEquipeById(t1Id.toString()).then(res => setTeam1Image(res.profileImage || null)).catch(() => {});
    }

    const t2Id = Number(match.team2Id || (match as any).team2?.id);
    if (t2Id) {
      getEquipeById(t2Id.toString()).then(res => setTeam2Image(res.profileImage || null)).catch(() => {});
    }

    try {
      const matchIdNumber = Number(match.id);
      const sels = await fetchMatchSelections(matchIdNumber, token);
      setSelections(sels);
    } catch(e) {
      console.log("Impossible de récupérer la composition des équipes.", e);
    }

    if (match.status === 'DISPUTED') {
      try {
        const response = await fetch(`/api/results/match/${match.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPreviousResult(data);
          setScoreTeam1(data.scoreTeam1);
          setScoreTeam2(data.scoreTeam2);
        }
      } catch (error) {}
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

<<<<<<< HEAD
=======
  // ✨ NOUVEAU : Fonction pour détecter les matchs finis !
>>>>>>> 9e7762c331dd75866010d49f0421beae9533f53b
  const isMatchFinished = (status: string) => {
    return status === 'FINISHED' || status === 'COMPLETED';
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;
    setSubmitError(null); 

    if (scoreTeam1 === '' || scoreTeam2 === '') {
      setSubmitError("Veuillez entrer les deux scores avant de sauvegarder !");
      return;
    }

    try {
      const response = await fetch(`/api/results/match/${selectedMatch.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scoreTeam1: scoreTeam1,
          scoreTeam2: scoreTeam2,
          forfeitTeam1: false,
          forfeitTeam2: false,
          adminEncoderId: selectedMatch.adminResponsibleId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Code ${response.status} - ${errorText}`);
      }

      handleCloseModal();
      onRefresh();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setSubmitError(`Impossible de contacter le Java : ${errorMessage}`);
    }
  };

  const inProgressMatches = matches.filter((match) => isMatchInProgress(match.scheduledDateTime, match.status));
<<<<<<< HEAD
=======
  
  // ✨ NOUVEAU : Liste des matchs terminés
>>>>>>> 9e7762c331dd75866010d49f0421beae9533f53b
  const finishedMatches = matches.filter((match) => isMatchFinished(match.status));

  const t1IdForFilter = selectedMatch?.team1Id || (selectedMatch as any)?.team1?.id;
  const t2IdForFilter = selectedMatch?.team2Id || (selectedMatch as any)?.team2?.id;
  const team1Players = selections.filter(s => s.teamId === t1IdForFilter);
  const team2Players = selections.filter(s => s.teamId === t2IdForFilter);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      
      {/* ======================= SECTION 1 : MATCHS EN COURS ======================= */}
      <Typography variant="h5" color="white" mb={3} borderBottom="2px solid #2a3b55" pb={1} textAlign="left">
        Matchs en cours ({inProgressMatches.length})
      </Typography>

      <Grid container spacing={2}>
        {inProgressMatches.map((match) => {
          const tournamentName = tournaments.find(t => t.id === match.tournamentId)?.nom || `Tournoi #${match.tournamentId}`;
          const isWaitingForCaptains = match.status === 'WAITING_VALIDATION';
          const isDisputed = match.status === 'DISPUTED';

          return (
            <Grid item xs={12} key={match.id}>
              <Card sx={{ 
                backgroundColor: '#111827', 
                border: '1px solid rgba(255,255,255,0.07)', 
                borderLeft: isWaitingForCaptains ? '4px solid #6b7280' : isDisputed ? '4px solid #ef4444' : '4px solid #e8822a' 
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box textAlign="left">
                    <Typography variant="h6" color="white" fontWeight={700}>
                      {match.team1Name || 'TBD'} VS {match.team2Name || 'TBD'}
                    </Typography>
                    <Typography variant="body2" color="#60a5fa" fontWeight="bold" sx={{ mb: 0.5 }}>
                      🏆 {tournamentName}
                    </Typography>
                    <Typography variant="body2" color="gray">
                      {new Date(match.scheduledDateTime).toLocaleString('fr-BE')}
                    </Typography>
                    
                    <Chip 
                      label={isWaitingForCaptains ? "En attente" : isDisputed ? "Contesté" : "En cours"} 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        backgroundColor: isWaitingForCaptains ? 'rgba(107,114,128,0.2)' : isDisputed ? 'rgba(239,68,68,0.2)' : 'rgba(232,130,42,0.1)', 
                        color: isWaitingForCaptains ? '#9ca3af' : isDisputed ? '#ef4444' : '#e8822a' 
                      }} 
                    />
                  </Box>

                  {isWaitingForCaptains ? (
                    <Button 
                      variant="contained" 
                      disabled 
                      sx={{ backgroundColor: '#374151 !important', color: '#9ca3af !important', cursor: 'not-allowed' }}
                    >
                      En attente de validation
                    </Button>
                  ) : isDisputed ? (
                    <Button 
                      variant="contained" 
                      onClick={() => handleOpenModal(match)} 
                      sx={{ backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
                    >
                      Ré-encoder (Contesté)
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      onClick={() => handleOpenModal(match)} 
                      sx={{ backgroundColor: '#e8822a', '&:hover': { backgroundColor: '#c86e20' } }}
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
          <Typography color="gray" sx={{ ml: 2, mt: 2, width: '100%', textAlign: 'left' }}>
            Aucun match n'est en cours pour le moment.
          </Typography>
        )}
      </Grid>


      {/* ======================= SECTION 2 : MATCHS TERMINÉS ======================= */}
      {finishedMatches.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" color="gray" mb={3} borderBottom="2px solid #2a3b55" pb={1} textAlign="left">
            Matchs terminés ({finishedMatches.length})
          </Typography>
          <Grid container spacing={2}>
            {finishedMatches.map((match) => {
              const tournamentName = tournaments.find(t => t.id === match.tournamentId)?.nom || `Tournoi #${match.tournamentId}`;

              return (
                <Grid item xs={12} key={match.id}>
                  <Card sx={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid rgba(255,255,255,0.05)', 
<<<<<<< HEAD
                    borderLeft: '4px solid #10b981',
                    opacity: 0.7 
=======
                    borderLeft: '4px solid #10b981', // Bordure verte !
                    opacity: 0.7 // Un peu transparent pour montrer que c'est fini
>>>>>>> 9e7762c331dd75866010d49f0421beae9533f53b
                  }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box textAlign="left">
                        <Typography variant="h6" color="white" fontWeight={700}>
                          {match.team1Name || 'TBD'} VS {match.team2Name || 'TBD'}
                        </Typography>
                        <Typography variant="body2" color="#60a5fa" fontWeight="bold" sx={{ mb: 0.5 }}>
                          🏆 {tournamentName}
                        </Typography>
                        <Typography variant="body2" color="gray">
                          {new Date(match.scheduledDateTime).toLocaleString('fr-BE')}
                        </Typography>
                        
                        <Chip 
                          label="Résultat Validé" 
                          size="small" 
<<<<<<< HEAD
                          sx={{ mt: 1, backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981' }} 
=======
                          sx={{ 
                            mt: 1, 
                            backgroundColor: 'rgba(16,185,129,0.2)', 
                            color: '#10b981' 
                          }} 
>>>>>>> 9e7762c331dd75866010d49f0421beae9533f53b
                        />
                      </Box>

                      <Button 
                        variant="contained" 
                        disabled 
                        sx={{ backgroundColor: '#064e3b !important', color: '#34d399 !important', cursor: 'not-allowed' }}
                      >
                        Match terminé
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}


      {/* ======================= POPUP D'ENCODAGE ======================= */}
      <Dialog 
        open={Boolean(selectedMatch)} 
        onClose={handleCloseModal} 
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a2540', color: 'white', p: 2, borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', mb: 3, pb: 2, textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Encoder le résultat
        </DialogTitle>

        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

          {previousResult && selectedMatch?.status === 'DISPUTED' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <strong>Score précédent refusé !</strong><br />
              {previousResult.validationStatusTeam1 === 'REJECTED' && (<span>🚨 <b>{selectedMatch.team1Name || 'L\'équipe 1'}</b> a contesté le score.<br /></span>)}
              {previousResult.validationStatusTeam2 === 'REJECTED' && (<span>🚨 <b>{selectedMatch.team2Name || 'L\'équipe 2'}</b> a contesté le score.</span>)}
              <br/><span style={{ fontSize: '0.85em' }}>Veuillez vérifier la vidéo et entrer le score final. Il sera irrévocable.</span>
            </Alert>
          )}

          {selectedMatch && (
            <Grid container spacing={4} alignItems="stretch" justifyContent="center">
              
              {/* ÉQUIPE 1 */}
              <Grid item xs={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar src={normalizeAvatarUrl(team1Image)} alt={selectedMatch.team1Name || 'Équipe 1'} sx={{ width: 90, height: 90, mb: 2, border: '3px solid rgba(255,255,255,0.2)' }} />
                <Typography variant="h5" color="#e8822a" fontWeight="bold" gutterBottom textAlign="center" sx={{ minHeight: '40px' }}>
                  {selectedMatch.team1Name || 'Équipe 1'}
                </Typography>
                
                <Box sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 2, p: 2, mb: 3, flexGrow: 1 }}>
                  <Typography variant="caption" color="gray" display="block" mb={2} textAlign="center" fontWeight="bold">COMPOSITION</Typography>
                  {team1Players.length > 0 ? team1Players.map(player => (
                    <Box key={player.memberId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar src={normalizeAvatarUrl(player.memberProfileImageUrl)} sx={{ width: 28, height: 28 }} />
                      <Typography variant="body1" color="white" noWrap>{player.memberTag}</Typography>
                    </Box>
                  )) : (<Typography variant="body2" color="rgba(255,255,255,0.3)" textAlign="center" mt={3}>Non encodée</Typography>)}
                </Box>
                
                <TextField
                  label="Score" type="number" variant="outlined" fullWidth value={scoreTeam1}
                  onChange={(e) => { const val = e.target.value; if (val === '') setScoreTeam1(''); else if (Number(val) >= 0) setScoreTeam1(Number(val)); }}
                  inputProps={{ min: 0 }}
                  sx={{ input: { color: 'white', textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', py: 2 }, label: { color: 'gray' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                />
              </Grid>

              {/* SÉPARATEUR VS */}
              <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h4" color="gray" fontWeight="bold" sx={{ opacity: 0.5 }}>VS</Typography>
              </Grid>

              {/* ÉQUIPE 2 */}
              <Grid item xs={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar src={normalizeAvatarUrl(team2Image)} alt={selectedMatch.team2Name || 'Équipe 2'} sx={{ width: 90, height: 90, mb: 2, border: '3px solid rgba(255,255,255,0.2)' }} />
                <Typography variant="h5" color="#e8822a" fontWeight="bold" gutterBottom textAlign="center" sx={{ minHeight: '40px' }}>
                  {selectedMatch.team2Name || 'Équipe 2'}
                </Typography>

                <Box sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 2, p: 2, mb: 3, flexGrow: 1 }}>
                  <Typography variant="caption" color="gray" display="block" mb={2} textAlign="center" fontWeight="bold">COMPOSITION</Typography>
                  {team2Players.length > 0 ? team2Players.map(player => (
                    <Box key={player.memberId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar src={normalizeAvatarUrl(player.memberProfileImageUrl)} sx={{ width: 28, height: 28 }} />
                      <Typography variant="body1" color="white" noWrap>{player.memberTag}</Typography>
                    </Box>
                  )) : (<Typography variant="body2" color="rgba(255,255,255,0.3)" textAlign="center" mt={3}>Non encodée</Typography>)}
                </Box>

                <TextField
                  label="Score" type="number" variant="outlined" fullWidth value={scoreTeam2}
                  onChange={(e) => { const val = e.target.value; if (val === '') setScoreTeam2(''); else if (Number(val) >= 0) setScoreTeam2(Number(val)); }}
                  inputProps={{ min: 0 }}
                  sx={{ input: { color: 'white', textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', py: 2 }, label: { color: 'gray' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 3, mt: 2, pb: 1, pr: 3, justifyContent: 'center' }}>
          <Button onClick={handleCloseModal} sx={{ color: 'gray', mr: 3, fontSize: '1.1rem' }}>Annuler</Button>
          <Button onClick={handleSubmitResult} variant="contained" size="large" sx={{ backgroundColor: '#4caf50', fontSize: '1.1rem', px: 4, py: 1.5, '&:hover': { backgroundColor: '#388e3c' } }}>Sauvegarder le Score</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMatchManagement;