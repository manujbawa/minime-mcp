import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6', // Blue-600
      light: '#60A5FA', // Blue-400
      dark: '#1D4ED8', // Blue-700
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Green-600
      light: '#34D399', // Green-400
      dark: '#047857', // Green-700
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFB', // Gray-50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827', // Gray-900
      secondary: '#6B7280', // Gray-500
    },
    divider: '#E5E7EB', // Gray-200
    warning: {
      main: '#F59E0B', // Yellow-600
    },
    error: {
      main: '#EF4444', // Red-600
    },
    success: {
      main: '#10B981', // Green-600
    },
    info: {
      main: '#3B82F6', // Blue-600
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem', // text-4xl
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem', // text-3xl
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem', // text-2xl
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem', // text-xl
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem', // text-lg
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem', // text-base
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
  },
});