import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Grid2 as Grid,
  Alert,
  Typography
} from '@mui/material';
import { 
  LearningPrompt, 
  AIPromptTemplate,
  CreateLearningPromptRequest,
  UpdateLearningPromptRequest,
  CreateAITemplateRequest,
  UpdateAITemplateRequest
} from '../../services/api';

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode: 'create' | 'edit';
  type: 'learning' | 'ai';
  prompt?: LearningPrompt | AIPromptTemplate | null;
  categories?: string[];
}

export const PromptModal: React.FC<PromptModalProps> = ({
  open,
  onClose,
  onSave,
  mode,
  type,
  prompt,
  categories = []
}) => {
  const [formData, setFormData] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      if (type === 'learning') {
        const learningPrompt = prompt as LearningPrompt;
        setFormData({
          prompt_name: learningPrompt.prompt_name || '',
          prompt_category: learningPrompt.prompt_category || '',
          prompt_template: learningPrompt.prompt_template || '',
          model: learningPrompt.configuration?.model || '',
          temperature: learningPrompt.configuration?.temperature || 0.7,
          max_tokens: learningPrompt.configuration?.max_tokens || 2000,
          is_active: learningPrompt.is_active ?? true,
          description: learningPrompt.description || ''
        });
      } else {
        const aiTemplate = prompt as AIPromptTemplate;
        setFormData({
          name: aiTemplate.name || '',
          category: aiTemplate.category || '',
          template: aiTemplate.template || '',
          description: aiTemplate.description || '',
          is_active: aiTemplate.is_active ?? true,
          is_public: aiTemplate.is_public ?? false
        });
        setTags(aiTemplate.tags || []);
      }
    } else {
      // Reset form for create mode
      setFormData(type === 'learning' ? {
        prompt_name: '',
        prompt_category: '',
        prompt_template: '',
        model: 'deepseek-coder:6.7b',
        temperature: 0.7,
        max_tokens: 2000,
        is_active: true,
        description: ''
      } : {
        name: '',
        category: '',
        template: '',
        description: '',
        is_active: true,
        is_public: false
      });
      setTags([]);
    }
  }, [prompt, type]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      if (type === 'learning') {
        const data = mode === 'create' ? {
          promptName: formData.prompt_name,
          promptCategory: formData.prompt_category,
          promptTemplate: formData.prompt_template,
          model: formData.model,
          temperature: parseFloat(formData.temperature),
          maxTokens: parseInt(formData.max_tokens),
          description: formData.description
        } as CreateLearningPromptRequest : {
          prompt_name: formData.prompt_name,
          prompt_category: formData.prompt_category,
          prompt_template: formData.prompt_template,
          model: formData.model,
          temperature: parseFloat(formData.temperature),
          max_tokens: parseInt(formData.max_tokens),
          is_active: formData.is_active,
          description: formData.description
        } as UpdateLearningPromptRequest;
        
        await onSave(data);
      } else {
        const data = mode === 'create' ? {
          name: formData.name,
          category: formData.category,
          template: formData.template,
          description: formData.description,
          is_active: formData.is_active,
          is_public: formData.is_public,
          tags
        } as CreateAITemplateRequest : {
          name: formData.name,
          category: formData.category,
          template: formData.template,
          description: formData.description,
          is_active: formData.is_active,
          is_public: formData.is_public,
          tags
        } as UpdateAITemplateRequest;
        
        await onSave(data);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    const action = mode === 'create' ? 'Create' : 'Edit';
    const promptType = type === 'learning' ? 'Learning Prompt' : 'AI Insight Template';
    return `${action} ${promptType}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid size={type === 'learning' ? 6 : 8}>
              <TextField
                fullWidth
                label={type === 'learning' ? 'Prompt Name' : 'Template Name'}
                value={formData[type === 'learning' ? 'prompt_name' : 'name'] || ''}
                onChange={(e) => handleChange(type === 'learning' ? 'prompt_name' : 'name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid size={type === 'learning' ? 6 : 4}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData[type === 'learning' ? 'prompt_category' : 'category'] || ''}
                  onChange={(e) => handleChange(type === 'learning' ? 'prompt_category' : 'category', e.target.value)}
                  label="Category"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid size={12}>
              <TextField
                fullWidth
                label="Prompt Template"
                value={formData[type === 'learning' ? 'prompt_template' : 'template'] || ''}
                onChange={(e) => handleChange(type === 'learning' ? 'prompt_template' : 'template', e.target.value)}
                multiline
                rows={8}
                required
                helperText="Use {variable_name} for dynamic variables"
              />
            </Grid>
            
            {type === 'learning' && (
              <>
                <Grid size={4}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={formData.model || ''}
                    onChange={(e) => handleChange('model', e.target.value)}
                  />
                </Grid>
                
                <Grid size={4}>
                  <TextField
                    fullWidth
                    label="Temperature"
                    type="number"
                    value={formData.temperature || 0.7}
                    onChange={(e) => handleChange('temperature', e.target.value)}
                    inputProps={{ min: 0, max: 2, step: 0.1 }}
                  />
                </Grid>
                
                <Grid size={4}>
                  <TextField
                    fullWidth
                    label="Max Tokens"
                    type="number"
                    value={formData.max_tokens || 2000}
                    onChange={(e) => handleChange('max_tokens', e.target.value)}
                    inputProps={{ min: 100, max: 4000, step: 100 }}
                  />
                </Grid>
              </>
            )}
            
            {type === 'ai' && (
              <Grid size={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button size="small" onClick={handleAddTag}>Add</Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(tag)}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
            
            <Grid size={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
            
            {type === 'ai' && (
              <Grid size={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_public ?? false}
                      onChange={(e) => handleChange('is_public', e.target.checked)}
                    />
                  }
                  label="Public"
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};