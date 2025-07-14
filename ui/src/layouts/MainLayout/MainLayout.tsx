import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, IconButton } from '@mui/material';
import { Menu } from '@mui/icons-material';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { layoutStyles } from './styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.root}>
        <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
        <Box sx={layoutStyles.content}>
          {/* Floating menu button when sidebar is closed */}
          {!sidebarOpen && (
            <IconButton
              onClick={handleSidebarToggle}
              sx={{
                position: 'fixed',
                top: 16,
                left: 16,
                zIndex: 1200,
                backgroundColor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: 'background.paper',
                  boxShadow: 3,
                },
              }}
            >
              <Menu />
            </IconButton>
          )}
          <Box component="main" sx={(theme) => layoutStyles.main(theme)}>
            {children || <Outlet />}
          </Box>
          <Footer />
        </Box>
      </Box>
    </ThemeProvider>
  );
};