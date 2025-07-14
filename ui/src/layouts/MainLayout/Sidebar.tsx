import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  Memory,
  Psychology,
  Analytics,
  Build,
  School,
  AdminPanelSettings,
  Code,
  ChevronLeft,
} from '@mui/icons-material';
import { DRAWER_WIDTH } from './styles';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: <Dashboard /> },
  { title: 'Projects', path: '/projects', icon: <Folder /> },
  { title: 'Memory Explorer', path: '/memories', icon: <Memory /> },
  { title: 'Sequential Thinking', path: '/thinking', icon: <Psychology /> },
  { title: 'Analytics', path: '/analytics', icon: <Analytics /> },
  { title: 'MCP Tools', path: '/mcp-tools', icon: <Build /> },
  { title: 'Meta-Learning', path: '/meta-learning', icon: <School /> },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src="/ui/images/mini-me-logo.png"
            alt="MiniMe MCP"
            style={{ 
              width: 60, 
              height: 60,
              borderRadius: '50%',
              border: '2px solid black'
            }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              MiniMe MCP
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v0.1.7
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onToggle} size="small">
          <ChevronLeft />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color={isActive ? 'secondary' : 'default'}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Connected to server
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'success.main',
            }}
          />
          <Typography variant="caption">
            localhost:8000
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};