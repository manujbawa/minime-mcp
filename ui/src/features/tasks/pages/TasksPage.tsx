import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';
import { TaskAlt as TaskIcon } from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';

export const TasksPage: React.FC = () => {
  return (
    <PageLayout>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TaskIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                  Tasks
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Manage your tasks and to-do items, track progress, and organize your development workflow.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
};