import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#bf00ff',
    },
    background: {
      default: '#080b14',
      paper: '#0d1322',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", sans-serif',
    h1: {
      fontFamily: '"Orbitron", sans-serif',
    },
    h2: {
      fontFamily: '"Orbitron", sans-serif',
    },
  },
});

export default theme;
