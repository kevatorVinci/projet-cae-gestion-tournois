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
  Chip
} from '@mui/material';

// ✨ On importe le Match global depuis types.ts !
import { Match } from '../../../types';

/**
 * Props for the AdminMatchManagement component.
 */
interface AdminMatchManagementProps {
  matches: Match[];
}

/**
 * Component to display matches in progress and a modal to encode results.
 *
 * @param {AdminMatchManagementProps} props - The component props containing matches from the database.
 * @returns {JSX.Element} The rendered component.
 */
const AdminMatchManagement = ({ matches }: AdminMatchManagementProps) => {
  // State to hold the match selected by the admin for encoding the score
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // States to hold the input scores for both teams
  const [scoreTeam1, setScoreTeam1] = useState<number | ''>('');
  const [scoreTeam2, setScoreTeam2] = useState<number | ''>('');

  /**
   * Opens the modal window and sets the selected match to encode.
   *
   * @param {Match} match - The match chosen by the admin.
   */
  const handleOpenModal = (match: Match) => {
    setSelectedMatch(match);
    setScoreTeam1('');
    setScoreTeam2('');
  };

  /**
   * Closes the modal window and clears the selected match.
   */
  const handleCloseModal = () => {
    setSelectedMatch(null);
  };

  /**
   * Checks if a match is currently in progress based on its scheduled date.
   *
   * @param {string} scheduledDateTime - The date and time the match is supposed to start from DB.
   * @param {string} status - The current database status of the match.
   * @returns {boolean} True if the match has started and is not finished.
   */
  const isMatchInProgress = (scheduledDateTime: string, status: string) => {
    const matchDate = new Date(scheduledDateTime);
    const now = new Date();
    
    return matchDate <= now && status !== 'FINISHED' && status !== 'COMPLETED';
  };

  /**
   * Handles the submission of the match result.
   */
  const handleSubmitResult = () => {
    if (selectedMatch) {
      console.log(`Encoding match ${selectedMatch.id} with score: ${scoreTeam1} - ${scoreTeam2}`);
      handleCloseModal();
    }
  };

  // Filters the matches to keep ONLY the ones that are "in progress" right now
  const inProgressMatches = matches.filter((match) => 
    isMatchInProgress(match.scheduledDateTime, match.status)
  );

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      
      {/* Title showing how many matches are in progress */}
      <Typography variant="h5" color="white" mb={3} borderBottom="2px solid #2a3b55" pb={1} textAlign="left">
        Matchs en cours ({inProgressMatches.length})
      </Typography>

      {/* --- MATCH LIST SECTION --- */}
      <Grid container spacing={2}>
        {/* Loops through the in-progress matches to create a visual card for each */}
        {inProgressMatches.map((match) => (
          <Grid item xs={12} key={match.id}>
            <Card
              sx={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: '4px solid #e8822a'
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box textAlign="left">
                  <Typography variant="h6" color="white" fontWeight={700}>
                    {/* On utilise .name car c'est comme ça dans ton interface Equipe ! */}
                    {match.team1?.name || 'TBD'} VS {match.team2?.name || 'TBD'}
                  </Typography>
                  
                  {/* Shows the date and time of the match */}
                  <Typography variant="body2" color="gray">
                    {new Date(match.scheduledDateTime).toLocaleString('fr-BE')}
                  </Typography>

                  <Chip
                    label="En cours"
                    size="small"
                    sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: '#e8822a' }}
                  />
                </Box>

                <Button
                  variant="contained"
                  onClick={() => handleOpenModal(match)}
                  sx={{
                    backgroundColor: '#e8822a',
                    '&:hover': { backgroundColor: '#c86e20' }
                  }}
                >
                  Encoder Résultat
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {inProgressMatches.length === 0 && (
          <Typography color="gray" sx={{ ml: 2, mt: 2, width: '100%', textAlign: 'left' }}>
            Aucun match n'est en cours pour le moment.
          </Typography>
        )}
      </Grid>

      {/* --- MODAL (DIALOG) SECTION --- */}
      <Dialog
        open={Boolean(selectedMatch)}
        onClose={handleCloseModal}
        PaperProps={{
          sx: { backgroundColor: '#1a2540', color: 'white', minWidth: '400px' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', mb: 2 }}>
          Encoder le résultat
        </DialogTitle>

        <DialogContent>
          {selectedMatch && (
            <Grid container spacing={4}>
              {/* Team 1 Column */}
              <Grid item xs={6}>
                <Typography variant="h6" color="#e8822a" gutterBottom>
                  {selectedMatch.team1?.name || 'Équipe 1'}
                </Typography>
                <Typography variant="subtitle2" color="gray" mb={2}>
                  Composition :
                </Typography>
                <ul>
                  {selectedMatch.team1?.members?.map((player) => (
                    <li key={player.id}>{player.tag}</li>
                  )) || <li>Aucun joueur</li>}
                </ul>
                <TextField
                  label="Score"
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={scoreTeam1}
                  onChange={(e) => setScoreTeam1(Number(e.target.value))}
                  sx={{ mt: 2, input: { color: 'white' }, label: { color: 'gray' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                />
              </Grid>

              {/* Team 2 Column */}
              <Grid item xs={6}>
                <Typography variant="h6" color="#e8822a" gutterBottom>
                  {selectedMatch.team2?.name || 'Équipe 2'}
                </Typography>
                <Typography variant="subtitle2" color="gray" mb={2}>
                  Composition :
                </Typography>
                <ul>
                  {selectedMatch.team2?.members?.map((player) => (
                    <li key={player.id}>{player.tag}</li>
                  )) || <li>Aucun joueur</li>}
                </ul>
                <TextField
                  label="Score"
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={scoreTeam2}
                  onChange={(e) => setScoreTeam2(Number(e.target.value))}
                  sx={{ mt: 2, input: { color: 'white' }, label: { color: 'gray' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2, pb: 2, pr: 3 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'gray' }}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmitResult}
            variant="contained"
            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMatchManagement;