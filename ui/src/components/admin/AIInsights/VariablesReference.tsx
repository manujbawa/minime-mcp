import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip
} from '@mui/material';
import { Grid } from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';

interface VariablesReferenceProps {
  variables: Record<string, string[]>;
}

export function VariablesReference({ variables }: VariablesReferenceProps) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Most Common (Used in 45+ templates)': '⭐',
      'Frequently Used (10-20 templates)': '🔥',
      'Occasionally Used (3-9 templates)': '📊',
      'Rarely Used (1-3 templates)': '🔧'
    };
    return icons[category] || '📌';
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      'Most Common (Used in 45+ templates)': 'Essential variables used across most insight types',
      'Frequently Used (10-20 templates)': 'Common variables for specific analysis types',
      'Occasionally Used (3-9 templates)': 'Specialized variables for targeted insights',
      'Rarely Used (1-3 templates)': 'Niche variables for specific edge cases'
    };
    return descriptions[category] || 'Category variables';
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Code />
          <Typography variant="h6" fontWeight={600}>
            Template Variables Reference
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Use these variables in your templates by wrapping them in curly braces, e.g., {'{memory_content}'}
        </Typography>

        {Object.entries(variables).map(([category, vars]) => (
          <Accordion 
            key={category}
            expanded={expanded === category} 
            onChange={handleChange(category)}
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              mb: 1,
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ bgcolor: 'grey.50' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Typography variant="h6">{getCategoryIcon(category)}</Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={600}>{category}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getCategoryDescription(category)}
                  </Typography>
                </Box>
                <Chip 
                  label={`${vars.length} variables`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Grid container spacing={1}>
                {vars.map(variable => (
                  <Grid key={variable} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        '&:hover': {
                          bgcolor: 'grey.200',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(`{${variable}}`);
                      }}
                    >
                      {'{'}
                      <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {variable}
                      </Box>
                      {'}'}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Click any variable to copy it to clipboard
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}