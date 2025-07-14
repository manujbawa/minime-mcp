import { createTheme } from '@mui/material/styles';

// Modern MUI v7 theme with enhanced features
export const theme = createTheme({
  // Enhanced color system for MUI v7
  palette: {
    mode: 'light',
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
  
  // Enhanced typography scale for better readability
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
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem', // text-3xl
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem', // text-2xl
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
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
  
  // Enhanced shape and spacing
  shape: {
    borderRadius: 8,
  },
  
  spacing: 8, // Default 8px spacing unit
  
  // Enhanced component overrides for MUI v7
  components: {
    // Button enhancements
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
          },
        },
      },
    },
    
    // Enhanced Card styling
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    // Enhanced Paper styling
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    
    // Enhanced Chip styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.75rem',
          height: 24,
          fontWeight: 500,
          '& .MuiChip-label': {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
        colorPrimary: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#1D4ED8',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        },
        colorSecondary: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#047857',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        },
      },
    },
    
    // Enhanced TextField styling
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(59, 130, 246, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    
    // Enhanced Dialog styling
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    
    // Enhanced Tooltip styling
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        arrow: {
          color: 'rgba(0, 0, 0, 0.9)',
        },
      },
    },
    
    // Enhanced AppBar styling
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#111827',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: 'none',
        },
      },
    },
    
    // Enhanced Drawer styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#F9FAFB',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    
  },
});