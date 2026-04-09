import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6e4a86',
    },
    secondary: {
      main: '#8a67a3',
    },
    background: {
      default: '#1f2023',
      paper: '#28292d',
    },
    text: {
      primary: '#ece8f1',
      secondary: '#a7a1af',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI Variable", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 750,
      letterSpacing: '-0.05em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 650,
          borderRadius: 10,
          boxShadow: 'none',
          backgroundColor: '#6e4a86',
          color: '#f3eef7',
          paddingInline: 14,
        },
        colorInherit: {
          backgroundColor: '#323338',
          color: '#ece8f1',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
          backgroundColor: '#313238',
          color: '#cfc9d8',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#2f3035',
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})
