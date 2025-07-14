import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';

export const LearningPage: React.FC = () => {
  return (
    <PageLayout>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                  Learning
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Track your learning progress, discover patterns in your development journey, and access personalized learning recommendations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
};