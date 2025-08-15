/**
 * Project Links Tab Component
 * Displays and manages relationships between projects
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  AccountTree as TreeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  TipsAndUpdates as SuggestionIcon,
  ViewList as ListViewIcon,
  Hub as GraphViewIcon,
} from '@mui/icons-material';
import { ProjectsAPI } from '../../../services/api/projects.api';
import type { ProjectLink, ProjectLinkSuggestion, Project } from '../../../types';
import { ProjectGraphView } from './ProjectGraphView';
import { useNavigate } from 'react-router-dom';

interface ProjectLinksTabProps {
  projectName: string;
  projectId: number;
}

export const ProjectLinksTab: React.FC<ProjectLinksTabProps> = ({ projectName, projectId }) => {
  const navigate = useNavigate();
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [suggestions, setSuggestions] = useState<ProjectLinkSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLink | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Form state
  const [formData, setFormData] = useState({
    target_project_name: '',
    target_project_id: 0,
    link_type: 'related' as ProjectLink['link_type'],
    visibility: 'full' as ProjectLink['visibility'],
    metadata: {},
  });

  useEffect(() => {
    loadProjectLinks();
    loadRelationshipHints();
    loadAllProjects();
  }, [projectName]);

  const loadProjectLinks = async () => {
    try {
      setLoading(true);
      const response = await ProjectsAPI.getProjectLinks(projectName, { include_stats: true });
      if (response.success && response.data) {
        setLinks(response.data);
      }
    } catch (err) {
      setError('Failed to load project links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationshipHints = async () => {
    try {
      const response = await ProjectsAPI.getRelationshipHints(projectName);
      if (response.success && response.data) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('Failed to load relationship hints:', err);
    }
  };

  const loadAllProjects = async () => {
    try {
      const response = await ProjectsAPI.list();
      if (response.success && response.data) {
        setAllProjects(response.data.filter(p => p.name !== projectName));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleCreateLink = async () => {
    try {
      const response = await ProjectsAPI.createProjectLink(projectName, formData);
      if (response.success) {
        setDialogOpen(false);
        loadProjectLinks();
        setFormData({
          target_project_name: '',
          target_project_id: 0,
          link_type: 'related',
          visibility: 'full',
          metadata: {},
        });
      }
    } catch (err) {
      setError('Failed to create project link');
      console.error(err);
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;
    
    try {
      const response = await ProjectsAPI.updateProjectLink(projectName, {
        target_project_id: editingLink.target_project_id,
        link_type: formData.link_type,
        visibility: formData.visibility,
        metadata: formData.metadata,
      });
      if (response.success) {
        setDialogOpen(false);
        setEditingLink(null);
        loadProjectLinks();
      }
    } catch (err) {
      setError('Failed to update project link');
      console.error(err);
    }
  };

  const handleDeleteLink = async (link: ProjectLink) => {
    if (!confirm(`Remove link to ${link.target_project_name}?`)) return;
    
    try {
      const response = await ProjectsAPI.deleteProjectLink(projectName, {
        target_project_id: link.target_project_id,
        link_type: link.link_type,
      });
      if (response.success) {
        loadProjectLinks();
      }
    } catch (err) {
      setError('Failed to delete project link');
      console.error(err);
    }
  };

  const handleSuggestionAccept = async (suggestion: ProjectLinkSuggestion) => {
    setFormData({
      target_project_name: suggestion.project_name,
      target_project_id: suggestion.project_id,
      link_type: suggestion.suggested_link_type as ProjectLink['link_type'],
      visibility: 'full',
      metadata: { auto_suggested: true, confidence: suggestion.confidence },
    });
    setDialogOpen(true);
  };

  const openEditDialog = (link: ProjectLink) => {
    setEditingLink(link);
    setFormData({
      target_project_name: link.target_project_name,
      target_project_id: link.target_project_id,
      link_type: link.link_type,
      visibility: link.visibility,
      metadata: link.metadata || {},
    });
    setDialogOpen(true);
  };

  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'parent':
      case 'child':
        return <TreeIcon fontSize="small" />;
      case 'dependency':
        return <LinkIcon fontSize="small" />;
      default:
        return <LinkIcon fontSize="small" />;
    }
  };

  const getLinkTypeColor = (type: string): 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'parent':
        return 'primary';
      case 'child':
        return 'secondary';
      case 'dependency':
        return 'warning';
      case 'fork':
        return 'info';
      case 'template':
        return 'success';
      default:
        return 'default';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'full':
        return <VisibilityIcon fontSize="small" />;
      case 'metadata_only':
        return <InfoIcon fontSize="small" />;
      case 'none':
        return <VisibilityOffIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Project Relationships</Typography>
        <Box display="flex" gap={2}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ListViewIcon />}
            >
              List
            </Button>
            <Button
              onClick={() => setViewMode('graph')}
              variant={viewMode === 'graph' ? 'contained' : 'outlined'}
              startIcon={<GraphViewIcon />}
              disabled={links.length === 0}
            >
              Graph
            </Button>
          </ButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Link
          </Button>
        </Box>
      </Box>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle1" gutterBottom>
            <SuggestionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Suggested Relationships
          </Typography>
          <List>
            {suggestions.map((suggestion, index) => (
              <React.Fragment key={suggestion.project_id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">{suggestion.project_name}</Typography>
                        <Chip
                          label={suggestion.suggested_link_type}
                          size="small"
                          color={getLinkTypeColor(suggestion.suggested_link_type)}
                        />
                        <Chip
                          label={`${Math.round(suggestion.confidence * 100)}% confidence`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {suggestion.reason}
                        </Typography>
                        {suggestion.evidence.reference_count && (
                          <Typography variant="caption" color="text.secondary">
                            • {suggestion.evidence.reference_count} cross-references found
                          </Typography>
                        )}
                        {suggestion.evidence.shared_tags && suggestion.evidence.shared_tags > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            • {suggestion.evidence.shared_tags} shared tags: {suggestion.evidence.common_tags?.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleSuggestionAccept(suggestion)}
                    >
                      Accept
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* View Content */}
      {viewMode === 'graph' ? (
        <ProjectGraphView
          projectId={projectId}
          projectName={projectName}
          links={links}
          onNodeClick={(name) => navigate(`/projects/${encodeURIComponent(name)}`)}
        />
      ) : (
        <Grid container spacing={2}>
        {links.length === 0 ? (
          <Grid size={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No project relationships yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Add links to related projects to enable cross-project memory search
              </Typography>
            </Paper>
          </Grid>
        ) : (
          links.map((link) => (
            <Grid item xs={12} md={6} key={link.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {link.target_project_name}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          icon={getLinkTypeIcon(link.link_type)}
                          label={link.link_type}
                          size="small"
                          color={getLinkTypeColor(link.link_type)}
                        />
                        <Tooltip title={`Visibility: ${link.visibility}`}>
                          <Chip
                            icon={getVisibilityIcon(link.visibility)}
                            label={link.visibility}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                      {link.target_project?.description && (
                        <Typography variant="body2" color="text.secondary">
                          {link.target_project.description}
                        </Typography>
                      )}
                      {link.target_project && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            {link.target_project.memory_count || 0} memories
                            {link.target_project.last_activity && 
                              ` • Last activity: ${new Date(link.target_project.last_activity).toLocaleDateString()}`
                            }
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openEditDialog(link)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteLink(link)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => {
        setDialogOpen(false);
        setEditingLink(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLink ? 'Edit Project Link' : 'Add Project Link'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {!editingLink && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Project</InputLabel>
                <Select
                  value={formData.target_project_name}
                  label="Target Project"
                  onChange={(e) => {
                    const project = allProjects.find(p => p.name === e.target.value);
                    setFormData({
                      ...formData,
                      target_project_name: e.target.value,
                      target_project_id: project?.id || 0,
                    });
                  }}
                >
                  {allProjects.map((project) => (
                    <MenuItem key={project.id} value={project.name}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Link Type</InputLabel>
              <Select
                value={formData.link_type}
                label="Link Type"
                onChange={(e) => setFormData({ ...formData, link_type: e.target.value as ProjectLink['link_type'] })}
              >
                <MenuItem value="related">Related</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="dependency">Dependency</MenuItem>
                <MenuItem value="fork">Fork</MenuItem>
                <MenuItem value="template">Template</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={formData.visibility}
                label="Visibility"
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as ProjectLink['visibility'] })}
              >
                <MenuItem value="full">Full - Access all memories</MenuItem>
                <MenuItem value="metadata_only">Metadata Only - See memory metadata</MenuItem>
                <MenuItem value="none">None - No memory access</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              Visibility controls how memories from the linked project appear in searches
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setEditingLink(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={editingLink ? handleUpdateLink : handleCreateLink}
            variant="contained"
            disabled={!formData.target_project_name && !editingLink}
          >
            {editingLink ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};