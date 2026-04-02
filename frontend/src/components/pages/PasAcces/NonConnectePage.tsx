import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NonConnectePage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" color="white" mb={2}>
        Acces refuse
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Vous devez etre connecte pour acceder a cette page.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/login')}
        sx={{
          backgroundColor: '#e8822a',
          '&:hover': { backgroundColor: '#c86e20' },
        }}
      >
        Se connecter
      </Button>
    </Box>
  );
}
