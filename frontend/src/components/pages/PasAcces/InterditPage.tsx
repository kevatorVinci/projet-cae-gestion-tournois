import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function InterditPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#080b14',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" color="white" mb={2}>
        Acces interdit
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Vous n avez pas les droits administrateur pour consulter cette page.
      </Typography>
      <Button variant="outlined" color="inherit" onClick={() => navigate('/')}>
        Retour accueil
      </Button>
    </Box>
  );
}
