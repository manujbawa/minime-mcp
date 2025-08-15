import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../../components/layout/PageLayout';
import { ProjectsAPI } from '../../../services/api/projects.api';
import type { Project, ProjectBrief, ProgressEntry, TaskItem, Memory, ThinkingSequence } from '../../../types';
import {
  ProjectHeader,
  ProjectStats,
  ProjectBriefSection,
  ProjectTabs,
  TabPanel,
  MarkdownModal,
  BriefsTab,
  ProgressTab,
  TasksTab,
  MemoriesTab,
  ThinkingTab,
  TimelineTab,
  ProjectLinksTab
} from '../components';

export const ProjectDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectName } = useParams<{ projectName: string }>();
  
  const [project, setProject] = useState<Project | null>(null);
  const [briefs, setBriefs] = useState<ProjectBrief[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [thinking, setThinking] = useState<ThinkingSequence[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Modal state for detailed content viewing
  const [modalContent, setModalContent] = useState<{
    open: boolean;
    title: string;
    content: string;
    metadata?: any;
  }>({
    open: false,
    title: '',
    content: '',
    metadata: undefined
  });

  useEffect(() => {
    if (projectName) {
      loadProjectData();
    }
  }, [projectName]);

  const loadProjectData = async () => {
    if (!projectName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load project details
      const projectResponse = await ProjectsAPI.get(projectName);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
      }

      // Load all memories (no limit)
      const memoriesResponse = await ProjectsAPI.getMemories(projectName, {});
      if (memoriesResponse.success && memoriesResponse.data) {
        setMemories(memoriesResponse.data);
      }

      // Load all thinking sequences (no limit)
      const thinkingResponse = await ProjectsAPI.getThinking(projectName, {});
      if (thinkingResponse.success && thinkingResponse.data) {
        setThinking(thinkingResponse.data);
      }

      // Load all tasks (no limit)
      const tasksResponse = await ProjectsAPI.getTasks(projectName, {});
      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data);
      }

      // Load all project briefs (memory_type = 'project_brief')
      const briefsResponse = await ProjectsAPI.getMemories(projectName, { 
        memory_type: 'project_brief'
      });
      if (briefsResponse.success && briefsResponse.data) {
        const projectBriefs = briefsResponse.data.map(memory => ({
          id: memory.id,
          project_name: projectName,
          content: memory.content,
          sections: memory.smart_tags || [],
          auto_tasks_created: memory.metadata?.auto_tasks_created || false,
          technical_analysis_included: memory.metadata?.technical_analysis_included || false,
          created_at: memory.created_at,
          updated_at: memory.updated_at
        }));
        setBriefs(projectBriefs);
      }

      // Load all progress entries (memory_type = 'progress')
      const progressResponse = await ProjectsAPI.getMemories(projectName, { 
        memory_type: 'progress'
      });
      if (progressResponse.success && progressResponse.data) {
        const progressEntries = progressResponse.data.map(memory => ({
          id: memory.id,
          project_name: projectName,
          version: memory.metadata?.version || 'v1.0',
          progress_description: memory.content,
          milestone_type: memory.metadata?.milestone_type || 'feature',
          completion_percentage: memory.metadata?.completion_percentage || 0,
          blockers: memory.metadata?.blockers || [],
          next_steps: memory.metadata?.next_steps || [],
          tags: memory.smart_tags || [],
          created_at: memory.created_at,
          updated_at: memory.updated_at
        }));
        setProgress(progressEntries);
      }

    } catch (error) {
      setError('Failed to load project details');
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const openContentModal = (title: string, content: string, metadata?: any) => {
    setModalContent({
      open: true,
      title,
      content,
      metadata
    });
  };

  const closeContentModal = () => {
    setModalContent({
      open: false,
      title: '',
      content: '',
      metadata: undefined
    });
  };

  const handleViewBrief = (brief: ProjectBrief) => {
    openContentModal(
      `Project Brief #${brief.id}`,
      brief.content,
      {
        created_at: brief.created_at,
        updated_at: brief.updated_at,
        sections: brief.sections,
        auto_tasks_created: brief.auto_tasks_created,
        technical_analysis_included: brief.technical_analysis_included
      }
    );
  };

  const handleViewProgress = (entry: ProgressEntry) => {
    const content = `**Version:** ${entry.version}\n\n**Description:** ${entry.progress_description}\n\n**Milestone Type:** ${entry.milestone_type}\n\n**Completion:** ${entry.completion_percentage}%\n\n${entry.blockers && entry.blockers.length > 0 ? `**Blockers:**\n${entry.blockers.map((b: string) => `- ${b}`).join('\n')}\n\n` : ''}${entry.next_steps && entry.next_steps.length > 0 ? `**Next Steps:**\n${entry.next_steps.map((s: string) => `- ${s}`).join('\n')}\n\n` : ''}`;
    
    openContentModal(
      `Progress v${entry.version}`,
      content,
      entry
    );
  };

  const handleViewTask = (task: TaskItem) => {
    const content = `**Title:** ${task.title}\n\n**Description:** ${task.description}\n\n**Category:** ${task.category}\n\n**Status:** ${task.status}\n\n**Priority:** ${task.priority?.urgency || 'medium'} urgency, ${task.priority?.impact || 'medium'} impact\n\n${task.estimated_hours ? `**Estimated Hours:** ${task.estimated_hours}h\n\n` : ''}`;
    
    openContentModal(
      `${task.category.toUpperCase()} Task: ${task.title}`,
      content,
      task
    );
  };

  const handleViewMemory = (memory: Memory) => {
    openContentModal(
      `${memory.memory_type.toUpperCase()} Memory`,
      memory.content,
      {
        created_at: memory.created_at,
        updated_at: memory.updated_at,
        memory_type: memory.memory_type,
        importance_score: memory.importance_score,
        smart_tags: memory.smart_tags,
      }
    );
  };

  const handleViewSequence = async (sequence: ThinkingSequence) => {
    try {
      // Load detailed sequence with thoughts
      const detailResponse = await ProjectsAPI.getThinkingSequenceDetails(sequence.id);
      const detailedSequence = detailResponse.success ? detailResponse.data : sequence;
      
      let content = `# ${detailedSequence.sequence_name}\n\n`;
      
      if (detailedSequence.goal) {
        content += `**🎯 Goal:** ${detailedSequence.goal}\n\n`;
      }
      
      if (detailedSequence.description) {
        content += `**📝 Description:** ${detailedSequence.description}\n\n`;
      }
      
      content += `**📊 Status:** ${detailedSequence.is_complete ? '✅ Complete' : '🔄 Active'}\n\n`;
      content += `**📅 Created:** ${new Date(detailedSequence.created_at).toLocaleDateString()}\n\n`;
      
      if (detailedSequence.thoughts && detailedSequence.thoughts.length > 0) {
        content += `**🧠 Total Thoughts:** ${detailedSequence.thoughts.length}\n\n`;
        content += `---\n\n`;
        content += `## 💭 Reasoning Process\n\n`;
        
        // Sort thoughts by thought_number
        const sortedThoughts = [...detailedSequence.thoughts].sort((a, b) => a.thought_number - b.thought_number);
        
        sortedThoughts.forEach((thought) => {
          const thoughtTypeEmoji = getThoughtTypeEmoji(thought.thought_type);
          
          content += `### ${thoughtTypeEmoji} Thought ${thought.thought_number}\n\n`;
          
          if (thought.thought_type) {
            content += `**Type:** ${thought.thought_type.charAt(0).toUpperCase() + thought.thought_type.slice(1)}\n\n`;
          }
          
          if (thought.confidence_level !== undefined) {
            content += `**Confidence:** ${Math.round((thought.confidence_level || 0) * 100)}%\n\n`;
          }
          
          content += `${thought.content}\n\n`;
          
          if (thought.is_revision) {
            content += `*🔄 This is a revision of an earlier thought*\n\n`;
          }
          
          if (thought.branch_from_thought_id) {
            content += `*🌿 This thought branches from thought #${thought.branch_from_thought_id}*\n\n`;
          }
          
          content += `---\n\n`;
        });
      } else {
        content += `*No thoughts recorded yet.*\n\n`;
      }
      
      openContentModal(
        `Thinking Sequence: ${detailedSequence.sequence_name}`,
        content,
        detailedSequence
      );
    } catch (error) {
      console.error('Error loading detailed sequence:', error);
      // Fallback to basic sequence info
      let content = `# ${sequence.sequence_name}\n\n`;
      content += `**Goal:** ${sequence.goal || 'Not specified'}\n\n`;
      content += `**Description:** ${sequence.description || 'No description provided'}\n\n`;
      content += `**Status:** ${sequence.is_complete ? 'Complete' : 'Active'}\n\n`;
      content += `*Error loading detailed thoughts. Please try again.*`;
      
      openContentModal(
        `Thinking Sequence: ${sequence.sequence_name}`,
        content,
        sequence
      );
    }
  };

  const getThoughtTypeEmoji = (type?: string): string => {
    const emojiMap: Record<string, string> = {
      'reasoning': '🤔',
      'conclusion': '🎯',
      'question': '❓',
      'hypothesis': '💡',
      'observation': '👁️',
      'assumption': '💭'
    };
    return emojiMap[type || 'reasoning'] || '💭';
  };

  // Placeholder functions for create actions
  const handleCreateBrief = () => {
    // TODO: Implement create brief dialog
    console.log('Create brief');
  };

  const handleAddProgress = () => {
    // TODO: Implement add progress dialog
    console.log('Add progress');
  };

  const handleCreateTask = () => {
    // TODO: Implement create task dialog
    console.log('Create task');
  };

  if (loading) {
    return (
      <PageLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            {error || 'Project not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
            Back to Projects
          </Button>
        </Box>
      </PageLayout>
    );
  }

  const stats = {
    memories: memories.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    progressEntries: progress.length,
    thinkingSequences: thinking.length,
    totalTokens: memories.reduce((sum, m) => sum + (m.token_metadata?.total_tokens || 0), 0)
  };

  return (
    <PageLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <ProjectHeader project={project} />

        {/* Quick Stats */}
        <ProjectStats stats={stats} />

        {/* Project Brief Section */}
        <ProjectBriefSection 
          briefs={briefs}
          onViewBrief={handleViewBrief}
          onCreateBrief={handleCreateBrief}
        />

        {/* Tabs */}
        <Box sx={{ width: '100%' }}>
          <ProjectTabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} />

          <TabPanel value={tabValue} index={0}>
            <BriefsTab 
              briefs={briefs}
              onCreateBrief={handleCreateBrief}
              onViewBrief={handleViewBrief}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ProgressTab 
              progress={progress}
              onAddProgress={handleAddProgress}
              onViewProgress={handleViewProgress}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TasksTab 
              tasks={tasks}
              onCreateTask={handleCreateTask}
              onViewTask={handleViewTask}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <MemoriesTab 
              memories={memories}
              onViewMemory={handleViewMemory}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <ThinkingTab 
              sequences={thinking}
              onViewSequence={handleViewSequence}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <TimelineTab 
              memories={memories}
              progress={progress}
              tasks={tasks}
              thinking={thinking}
              briefs={briefs}
              onViewContent={openContentModal}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            <ProjectLinksTab 
              projectName={projectName || ''}
              projectId={project.id}
            />
          </TabPanel>
        </Box>

        {/* Markdown Modal */}
        <MarkdownModal
          open={modalContent.open}
          onClose={closeContentModal}
          title={modalContent.title}
          content={modalContent.content}
          metadata={modalContent.metadata}
        />
      </Box>
    </PageLayout>
  );
};