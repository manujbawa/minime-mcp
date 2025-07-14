import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';

export function VariablesReference() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Variables actually used in learning prompt templates
  const variables: Record<string, Array<{ name: string; description: string }>> = {
    'Primary Variables': [
      { name: 'content', description: 'The memory content to be analyzed' },
      { name: 'memory_type', description: 'Type of memory: code, decision, rule, note, progress, project_brief, tech_reference, general' },
      { name: 'project_name', description: 'Name of the project' }
    ],
    'Validation Variables': [
      { name: 'detected_patterns', description: 'JSON array of previously detected patterns (only used in validate_patterns prompt)' }
    ]
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Content Variables': '📝',
      'Context Variables': '🔍',
      'Metadata Variables': '🏷️',
      'Pattern Detection Variables': '🎯',
      'Task Extraction Variables': '✅'
    };
    return icons[category] || '📌';
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
          Use these variables in your prompt templates by wrapping them in curly braces, e.g., {'{content}'}, {'{project_name}'}
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
                </Box>
                <Chip 
                  label={`${vars.length} variables`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                {vars.map(variable => (
                  <Grid key={variable.name} size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'grey.200',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(`{${variable.name}}`);
                      }}
                    >
                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', mb: 0.5 }}>
                        {'{'}
                        <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {variable.name}
                        </Box>
                        {'}'}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {variable.description}
                      </Typography>
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

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> These are the variables actually used by learning prompt templates:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
            <Typography component="li" variant="body2">
              <strong>Pattern Detection Prompts:</strong> Use {'{content}'}, {'{memory_type}'}, and {'{project_name}'}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Technology Extraction:</strong> Uses only {'{content}'}
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Pattern Validation:</strong> Uses {'{content}'} and {'{detected_patterns}'}
            </Typography>
          </Box>
        </Alert>
      </CardContent>
    </Card>
  );
}