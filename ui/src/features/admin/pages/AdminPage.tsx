import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  Psychology as AIIcon,
  Quiz as PromptIcon,
  School as LearningIcon
} from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { TabPanel, a11yProps } from '../../../components/shared/TabPanel';
import { PromptTestingTab } from '../../../components/admin/PromptTesting/PromptTestingTab';
import { AIInsightsTab } from '../../../components/admin/AIInsights/AIInsightsTab';
import { LearningPromptsTab } from '../../../components/admin/LearningPrompts/LearningPromptsTab';

export const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabs = [
    {
      label: 'Prompt Testing',
      icon: <PromptIcon />,
      component: <PromptTestingTab />
    },
    {
      label: 'AI Insights',
      icon: <AIIcon />,
      component: <AIInsightsTab />
    },
    {
      label: 'Learning Prompts',
      icon: <LearningIcon />,
      component: <LearningPromptsTab />
    }
  ];

  return (
    <PageLayout 
      title="Administration"
      subtitle="Manage system settings, prompt templates, and administrative functions."
    >
      {/* Tabs Navigation */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ 
                  gap: 1,
                  minWidth: isMobile ? 'auto' : 140
                }}
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Card>
    </PageLayout>
  );
};