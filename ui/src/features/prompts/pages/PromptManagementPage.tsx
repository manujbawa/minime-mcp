import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { Psychology, School, BugReport } from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { TabPanel } from '../../../components/shared/TabPanel';
import { AIInsightsTab } from '../../../components/admin/AIInsights/AIInsightsTab';
import { LearningPromptsTab } from '../../../components/admin/LearningPrompts/LearningPromptsTab';
import { PromptTestingTab } from '../../../components/admin/PromptTesting/PromptTestingTab';

/**
 * Prompt Management Page
 * Provides a unified interface for managing AI insight templates, learning prompts,
 * and testing prompts with real data.
 */
export function PromptManagementPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <PageLayout title="Prompt Management">
      <Box sx={{ width: '100%' }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage prompt templates for AI insights, learning pipeline, and test prompts with real data.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="prompt management tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                minHeight: 48,
              }
            }}
          >
            <Tab 
              icon={<Psychology />} 
              iconPosition="start" 
              label="AI Insight Templates" 
            />
            <Tab 
              icon={<School />} 
              iconPosition="start" 
              label="Learning Prompts" 
            />
            <Tab 
              icon={<BugReport />} 
              iconPosition="start" 
              label="Prompt Testing" 
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <AIInsightsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <LearningPromptsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PromptTestingTab />
        </TabPanel>
      </Box>
    </PageLayout>
  );
}