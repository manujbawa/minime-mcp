import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Psychology, Save } from '@mui/icons-material';
import { AIInsightTemplate } from '../../../hooks/admin/useAIInsights';

interface AIInsightModalProps {
  open: boolean;
  onClose: () => void;
  editingTemplate: AIInsightTemplate | null;
  formData: {
    name: string;
    category: string;
    template: string;
    description: string;
    is_public: boolean;
    is_active: boolean;
    tags: string[];
  };
  onSave: () => void;
  onFieldChange: (field: string, value: any) => void;
  showVariableMenu: boolean;
  variableMenuPosition: { top: number; left: number };
  currentVariableSearch: string;
  availableVariables: Record<string, string[]>;
  onInsertVariable: (variable: string) => void;
}

const CATEGORIES = [
  { value: 'bugs', label: 'Bugs & Issues' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'build', label: 'Build & DevOps' },
  { value: 'rules', label: 'Rules & Constraints' },
  { value: 'performance', label: 'Performance' },
  { value: 'process', label: 'Process & Team' },
  { value: 'technology', label: 'Technology' },
  { value: 'team', label: 'Team Dynamics' }
];

const COMMON_TAGS = [
  'code-quality',
  'best-practices',
  'anti-patterns',
  'technical-debt',
  'refactoring',
  'optimization',
  'security',
  'testing',
  'documentation',
  'collaboration'
];

export function AIInsightModal({
  open,
  onClose,
  editingTemplate,
  formData,
  onSave,
  onFieldChange,
  showVariableMenu,
  variableMenuPosition,
  currentVariableSearch,
  availableVariables,
  onInsertVariable
}: AIInsightModalProps) {
  const isFormValid = formData.name && formData.template;

  // Filter variables based on search
  const getFilteredVariables = () => {
    const searchLower = currentVariableSearch.toLowerCase();
    const filtered: Record<string, string[]> = {};
    
    Object.entries(availableVariables).forEach(([category, vars]) => {
      const filteredVars = vars.filter(v => v.toLowerCase().includes(searchLower));
      if (filteredVars.length > 0) {
        filtered[category] = filteredVars;
      }
    });
    
    return filtered;
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology />
            <Typography variant="h6">
              {editingTemplate ? 'Edit AI Insight Template' : 'Create New AI Insight Template'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid xs={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder="e.g., detect_code_smells"
                required
                helperText="Unique identifier for this template"
              />
            </Grid>
            <Grid xs={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => onFieldChange('category', e.target.value)}
                  label="Category"
                >
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => onFieldChange('description', e.target.value)}
                placeholder="Brief description of what insights this template generates"
                multiline
                rows={2}
              />
            </Grid>
            <Grid xs={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Prompt Template"
                value={formData.template}
                onChange={(e) => onFieldChange('template', e.target.value)}
                placeholder="Enter your prompt template with {variable} placeholders..."
                multiline
                rows={8}
                required
                helperText="Type '{' to see available variables. Use {variable_name} for dynamic placeholders"
                sx={{
                  '& .MuiInputBase-root': {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  '& .MuiInputBase-input': {
                    overflow: 'auto !important',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  }
                }}
              />
            </Grid>
            <Grid xs={{ xs: 12, md: 8 }}>
              <Autocomplete
                multiple
                freeSolo
                options={COMMON_TAGS}
                value={formData.tags}
                onChange={(_, newValue) => onFieldChange('tags', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags for categorization"
                    helperText="Press Enter to add custom tags"
                  />
                )}
              />
            </Grid>
            <Grid xs={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => onFieldChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid xs={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={(e) => onFieldChange('is_public', e.target.checked)}
                  />
                }
                label="Public"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.875rem' 
                  } 
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>
                Available to all projects
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={!isFormValid}
            startIcon={<Save />}
          >
            {editingTemplate ? 'Update' : 'Create'} Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Variable Menu Popup */}
      {showVariableMenu && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            top: variableMenuPosition.top,
            left: variableMenuPosition.left,
            maxHeight: 300,
            width: 300,
            overflow: 'auto',
            zIndex: 1500,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 1, bgcolor: 'grey.100' }}>
            <Typography variant="caption" fontWeight={600}>
              Available Variables {currentVariableSearch && `(filtered: ${currentVariableSearch})`}
            </Typography>
          </Box>
          <List dense>
            {Object.entries(getFilteredVariables()).map(([category, vars]) => (
              <Box key={category}>
                <ListItem>
                  <ListItemText 
                    primary={category} 
                    primaryTypographyProps={{ 
                      variant: 'caption', 
                      fontWeight: 600,
                      color: 'primary'
                    }} 
                  />
                </ListItem>
                {vars.map(variable => (
                  <ListItemButton
                    key={variable}
                    onClick={() => onInsertVariable(variable)}
                    sx={{ pl: 3 }}
                  >
                    <ListItemText 
                      primary={`{${variable}}`}
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Paper>
      )}
    </>
  );
}