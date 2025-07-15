import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        MiniMe MCP v0.2.0 | {' '}
        <Link
          color="inherit"
          href="https://github.com/anthropics/mcp"
          target="_blank"
          rel="noopener"
        >
          Model Context Protocol
        </Link>
        {' '} | © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};