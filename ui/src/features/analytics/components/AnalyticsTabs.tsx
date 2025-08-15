/**
 * Analytics Tabs Component
 * Main tabbed interface for different analytics views
 */

import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import {
  ShowChart,
  PieChart,
  Assessment,
  Insights,
  DataUsage,
} from '@mui/icons-material';

interface AnalyticsTabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  children: React.ReactNode;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => onTabChange(newValue)}>
          <Tab icon={<ShowChart />} label="Trends & Growth" />
          <Tab icon={<PieChart />} label="Distributions" />
          <Tab icon={<Assessment />} label="Performance" />
          <Tab icon={<Insights />} label="Intelligence" />
          <Tab icon={<DataUsage />} label="Token Usage" />
        </Tabs>
      </Box>
      {children}
    </>
  );
};