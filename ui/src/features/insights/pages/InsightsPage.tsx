import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';

export const InsightsPage: React.FC = () => {
  return (
    <PageLayout>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                  Insights
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Discover AI-powered insights about your development patterns, code quality, technical debt, and productivity trends.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
};