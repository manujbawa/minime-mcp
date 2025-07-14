import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';

export const ConfigPage: React.FC = () => {
  return (
    <PageLayout>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                  Configuration
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Configure application settings, API keys, model preferences, and other system configurations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
};