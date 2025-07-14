import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Container } from '@mui/material';
import { Grid } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  maxWidth = 'xl',
}) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth={maxWidth} sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 2 }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={index} color="text.primary" variant="body2">
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (crumb.path) navigate(crumb.path);
                  }}
                  sx={{ cursor: 'pointer' }}
                  variant="body2"
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}
        
        <Grid container spacing={2} alignItems="center">
          <Grid xs>
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Grid>
          {actions && (
            <Grid xs="auto">
              {actions}
            </Grid>
          )}
        </Grid>
      </Box>
      
      {children}
    </Container>
  );
};