/**
 * Sequential Thinking Page
 * Main page for viewing and managing thinking sequences
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import {
  Psychology as Brain,
  Close,
  AccountTree,
  TableChart,
  Timeline
} from '@mui/icons-material';
import { useApp } from '../../../contexts/AppContext';
import { ProjectsAPI } from '../../../services/api';
import { FlowDiagram } from '../components/FlowDiagram';
import { SequenceCard } from '../components/SequenceCard';
import { ThoughtCard } from '../components/ThoughtCard';
import { PageLayout } from '../../../components/layout/PageLayout';
import type { ThinkingSequence, Thought } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const SequentialThinkingPage: React.FC = () => {
  const { addNotification } = useApp();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [sequences, setSequences] = useState<ThinkingSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<ThinkingSequence | null>(null);
  const [sequenceDetails, setSequenceDetails] = useState<ThinkingSequence | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].name);
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadSequences();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ProjectsAPI.list();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load projects'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSequences = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ProjectsAPI.getThinking(selectedProject);
      setSequences(response.data || []);
    } catch (error) {
      setError('Failed to load thinking sequences');
      console.error('Error loading sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSequenceDetails = async (sequence: ThinkingSequence) => {
    try {
      setDetailsLoading(true);
      const response = await ProjectsAPI.getThinkingSequenceDetails(sequence.id);
      setSequenceDetails(response.data);
    } catch (error) {
      console.error('Error loading sequence details:', error);
      // Fallback to the sequence data we have
      setSequenceDetails(sequence);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSequenceClick = (sequence: ThinkingSequence) => {
    setSelectedSequence(sequence);
    loadSequenceDetails(sequence);
  };

  const selectedProjectData = projects.find(p => p.name === selectedProject);

  const stats = [
    {
      label: 'Total Sequences',
      value: selectedProjectData?.thinking_sequence_count || 0,
      icon: Brain,
      color: 'primary.main'
    },
    {
      label: 'Completed',
      value: sequences.filter(s => s.is_complete).length,
      icon: Brain,
      color: 'success.main'
    },
    {
      label: 'In Progress',
      value: sequences.filter(s => !s.is_complete).length,
      icon: Brain,
      color: 'warning.main'
    },
    {
      label: 'Related Memories',
      value: selectedProjectData?.memory_count || 0,
      icon: Brain,
      color: 'info.main'
    }
  ];

  return (
    <PageLayout
      title="Sequential Thinking"
      subtitle="Explore your structured reasoning processes and thought sequences"
    >
      {/* Project Selection */}
      {projects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              label="Select Project"
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.name}>
                  {project.name} ({project.thinking_sequence_count || 0} sequences)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Project Stats */}
      {selectedProjectData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.color }}>
                      <Brain />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Thinking Sequences */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sequences.length > 0 ? (
        <Grid container spacing={3}>
          {sequences.map((sequence) => (
            <Grid size={{ xs: 12 }} key={sequence.id}>
              <SequenceCard 
                sequence={sequence} 
                onClick={() => handleSequenceClick(sequence)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Brain sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No thinking sequences yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thinking sequences will appear here as you use the MCP tools to structure your reasoning
          </Typography>
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'primary.50', 
            border: '1px solid', 
            borderColor: 'primary.200', 
            maxWidth: 400, 
            mx: 'auto' 
          }}>
            <Typography variant="body2" color="primary.dark">
              <strong>Tip:</strong> Use the "start_thinking_sequence" MCP tool in your IDE to begin structured reasoning
            </Typography>
          </Paper>
        </Paper>
      )}

      {/* Sequence Detail Modal */}
      <Dialog
        open={Boolean(selectedSequence)}
        onClose={() => setSelectedSequence(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { height: '90vh' } } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTree />
              <Typography variant="h6">
                {selectedSequence?.sequence_name}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedSequence(null)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : sequenceDetails ? (
            <>
              {/* Sequence Info */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {sequenceDetails.description}
                </Typography>
                {sequenceDetails.goal && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Brain sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="primary.main">
                      <strong>Goal:</strong> {sequenceDetails.goal}
                    </Typography>
                  </Box>
                )}
                {sequenceDetails.conclusion && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Conclusion:</strong> {sequenceDetails.conclusion}
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  <Tab icon={<Timeline />} label="Flow View" />
                  <Tab icon={<TableChart />} label="Table View" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <TabPanel value={tabValue} index={0}>
                  <FlowDiagram 
                    thoughts={sequenceDetails.thoughts || []} 
                    width={800} 
                    height={500} 
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                      {(sequenceDetails.thoughts || []).map((thought) => (
                        <Grid size={{ xs: 12 }} key={thought.id}>
                          <ThoughtCard thought={thought} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </TabPanel>
              </Box>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSequence(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};