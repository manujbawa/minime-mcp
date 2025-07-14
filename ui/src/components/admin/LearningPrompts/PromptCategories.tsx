import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';

const categories = [
  {
    title: 'Pattern Detection',
    color: 'primary.main',
    description: 'Identifies coding patterns, architectural decisions, and anti-patterns in development memories.'
  },
  {
    title: 'Technology Extraction',
    color: 'success.main',
    description: 'Extracts technologies, frameworks, and tools mentioned in memories for tech stack analysis.'
  },
  {
    title: 'Insight Generation',
    color: 'warning.main',
    description: 'Generates actionable insights from patterns and trends across multiple memories.'
  },
  {
    title: 'Validation',
    color: 'error.main',
    description: 'Validates detected patterns and insights for accuracy and relevance.'
  }
];

export function PromptCategories() {
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Prompt Categories
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {categories.map((category) => (
            <Grid key={category.title} item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  color={category.color} 
                  gutterBottom
                >
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}