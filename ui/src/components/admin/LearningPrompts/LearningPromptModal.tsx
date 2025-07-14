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
} from '@mui/material';
import { Grid } from '@mui/material';
import { Code, Save } from '@mui/icons-material';
import { LearningPromptTemplate } from '../../../hooks/admin/useLearningPrompts';

interface LearningPromptModalProps {
  open: boolean;
  onClose: () => void;
  editingPrompt: LearningPromptTemplate | null;
  formData: {
    prompt_name: string;
    prompt_category: string;
    prompt_type: string;
    prompt_template: string;
    description: string;
    applicable_memory_types: string[] | null;
    configuration: {
      temperature?: number;
      max_tokens?: number;
    };
    is_active: boolean;
    priority: number;
  };
  onSave: () => void;
  onFieldChange: (field: string, value: any) => void;
  onConfigChange: (field: string, value: any) => void;
}

const MEMORY_TYPES = [
  'code',
  'architecture',
  'bug',
  'decision',
  'implementation_notes',
  'design_decisions',
  'insight'
];

export function LearningPromptModal({
  open,
  onClose,
  editingPrompt,
  formData,
  onSave,
  onFieldChange,
  onConfigChange
}: LearningPromptModalProps) {
  const isFormValid = formData.prompt_name && formData.prompt_template;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code />
          <Typography variant="h6">
            {editingPrompt ? 'Edit Learning Prompt Template' : 'Create New Learning Prompt Template'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, width: '100%' }}>
          <Grid container spacing={3}>
            <Grid xs={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Prompt Name"
                value={formData.prompt_name}
                onChange={(e) => onFieldChange('prompt_name', e.target.value)}
                placeholder="e.g., detect_patterns_general"
                required
                helperText="Unique identifier for this prompt"
              />
            </Grid>
            <Grid xs={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.prompt_category}
                  onChange={(e) => onFieldChange('prompt_category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="pattern_detection">Pattern Detection</MenuItem>
                  <MenuItem value="technology_extraction">Technology Extraction</MenuItem>
                  <MenuItem value="insight_generation">Insight Generation</MenuItem>
                  <MenuItem value="validation">Validation</MenuItem>
                  <MenuItem value="classification">Classification</MenuItem>
                  <MenuItem value="analysis">Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.prompt_type}
                  onChange={(e) => onFieldChange('prompt_type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="memory_type_specific">Memory Type Specific</MenuItem>
                  <MenuItem value="context_aware">Context Aware</MenuItem>
                  <MenuItem value="chain_of_thought">Chain of Thought</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => onFieldChange('description', e.target.value)}
                placeholder="Brief description of what this prompt does"
                multiline
                rows={2}
              />
            </Grid>
            <Grid xs={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Prompt Template"
                value={formData.prompt_template}
                onChange={(e) => onFieldChange('prompt_template', e.target.value)}
                placeholder="Enter your prompt template with {variable} placeholders..."
                multiline
                rows={8}
                required
                helperText="Use {variable_name} for dynamic placeholders"
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
            <Grid xs={{ xs: 12, md: 6 }}>
              <Autocomplete
                multiple
                options={MEMORY_TYPES}
                value={formData.applicable_memory_types || []}
                onChange={(_, newValue) => onFieldChange('applicable_memory_types', newValue || [])}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Applicable Memory Types"
                    placeholder="Select memory types this prompt applies to"
                  />
                )}
              />
            </Grid>
            <Grid xs={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={formData.priority}
                onChange={(e) => onFieldChange('priority', parseInt(e.target.value))}
                helperText="Lower number = higher priority"
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid xs={{ xs: 12, md: 3 }}>
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
            <Grid xs={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                LLM Configuration
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Temperature"
                  type="number"
                  value={formData.configuration.temperature || 0.1}
                  onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                  sx={{ width: 150 }}
                />
                <TextField
                  label="Max Tokens"
                  type="number"
                  value={formData.configuration.max_tokens || 2000}
                  onChange={(e) => onConfigChange('max_tokens', parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 8000 }}
                  sx={{ width: 150 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
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
          {editingPrompt ? 'Update' : 'Create'} Prompt
        </Button>
      </DialogActions>
    </Dialog>
  );
}