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
      default: '#040a1a',
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
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: 'none',
        },
        containedPrimary: {
          backgroundColor: '#e8822a',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#c86e20',
            boxShadow: 'none',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(232,130,42,0.45)',
          color: '#e8822a',
          '&:hover': {
            borderColor: '#e8822a',
            backgroundColor: 'rgba(232,130,42,0.08)',
          },
        },
        textPrimary: {
          color: '#e8822a',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          borderRadius: 12,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.14)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(232,130,42,0.55)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e8822a',
            borderWidth: 2,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ef4444',
          },
        },
        input: {
          color: '#fff',
          paddingTop: 14,
          paddingBottom: 14,
          '&::placeholder': {
            color: 'rgba(255,255,255,0.4)',
            opacity: 1,
          },
        },
        multiline: {
          padding: 0,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.72)',
          '&.Mui-focused': {
            color: '#e8822a',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'rgba(255,255,255,0.5)',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.55)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a2540',
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111827',
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
});

export default theme;
