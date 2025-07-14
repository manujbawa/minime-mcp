import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import { FlexFormRow } from '../../shared';

interface TestControlsProps {
  promptTestTable: 'learning' | 'task' | 'insights' | '';
  testPrompts: any[];
  selectedTestPromptId: string;
  memoryTypeFilter: string;
  testMemories: any[];
  selectedTestMemory: string;
  testModel: string;
  availableModels: string[];
  onTableChange: (value: 'learning' | 'task' | 'insights' | '') => void;
  onPromptSelect: (promptId: string) => void;
  onMemoryTypeChange: (type: string) => void;
  onMemorySelect: (memoryId: string) => void;
  onModelChange: (model: string) => void;
}

// Helper function to truncate text for display
const truncateText = (text: string, maxLength: number = 50): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Helper function to format memory display text
const formatMemoryText = (memory: any): string => {
  const type = memory.memory_type || 'unknown';
  const project = memory.project_name || 'no-project';
  const preview = memory.contentPreview || 'no preview';
  return `[${type}] ${project} - ${preview}`;
};

export function TestControls({
  promptTestTable,
  testPrompts = [],
  selectedTestPromptId,
  memoryTypeFilter,
  testMemories = [],
  selectedTestMemory,
  testModel,
  availableModels = [],
  onTableChange,
  onPromptSelect,
  onMemoryTypeChange,
  onMemorySelect,
  onModelChange
}: TestControlsProps) {
  // Ensure arrays are valid
  const safeTestPrompts = Array.isArray(testPrompts) ? testPrompts : [];
  const safeAvailableModels = Array.isArray(availableModels) ? availableModels : [];
  const safeTestMemories = Array.isArray(testMemories) ? testMemories : [];
  
  const memoryTypes = [
    'all', 'code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'tech_reference', 'general'
  ];

  return (
    <FlexFormRow mb={0} minItemWidth="280px">
      <FormControl size="small" fullWidth>
        <InputLabel>Table</InputLabel>
        <Select
          value={promptTestTable}
          onChange={(e: SelectChangeEvent) => onTableChange(e.target.value as any)}
          label="Table"
        >
          <MenuItem value="">
            <em>Select Value</em>
          </MenuItem>
          <MenuItem value="learning">Learning Prompts</MenuItem>
          <MenuItem value="insights">AI Insight Prompts</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth disabled={!promptTestTable}>
        <InputLabel>Prompt</InputLabel>
        <Select
          value={selectedTestPromptId}
          onChange={(e: SelectChangeEvent) => onPromptSelect(e.target.value)}
          label="Prompt"
        >
          <MenuItem value="">
            <em>No Value Selected</em>
          </MenuItem>
          {safeTestPrompts.length === 0 ? (
            <MenuItem value="" disabled>No prompts loaded</MenuItem>
          ) : (
            safeTestPrompts.map(prompt => {
              const displayText = `${prompt.prompt_name || prompt.name} (${prompt.prompt_category || prompt.category})`;
              const truncatedText = truncateText(displayText, 60);
              
              return (
                <Tooltip key={prompt.id} title={displayText} arrow placement="top">
                  <MenuItem value={prompt.id.toString()}>
                    {truncatedText}
                  </MenuItem>
                </Tooltip>
              );
            })
          )}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Model</InputLabel>
        <Select
          value={testModel}
          onChange={(e: SelectChangeEvent) => onModelChange(e.target.value)}
          label="Model"
        >
          <MenuItem value="">
            <em>No Value Selected</em>
          </MenuItem>
          {safeAvailableModels.length === 0 ? (
            <MenuItem value={testModel}>{testModel}</MenuItem>
          ) : (
            safeAvailableModels.map(model => (
              <MenuItem key={model} value={model}>{model}</MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Memory Type</InputLabel>
        <Select
          value={memoryTypeFilter}
          onChange={(e: SelectChangeEvent) => onMemoryTypeChange(e.target.value)}
          label="Memory Type"
        >
          {memoryTypes.map(type => (
            <MenuItem key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>
          Memory for Testing {safeTestMemories.length > 0 && `(${safeTestMemories.length})`}
        </InputLabel>
        <Select
          value={selectedTestMemory}
          onChange={(e: SelectChangeEvent) => onMemorySelect(e.target.value)}
          label={`Memory for Testing ${safeTestMemories.length > 0 ? `(${safeTestMemories.length})` : ''}`}
        >
          <MenuItem value="">
            <em>Use Default Test Content</em>
          </MenuItem>
          {safeTestMemories.length === 0 ? (
            <MenuItem value="" disabled>No memories found</MenuItem>
          ) : (
            safeTestMemories.map(memory => {
              const fullText = formatMemoryText(memory);
              const truncatedText = truncateText(fullText, 70);
              
              return (
                <Tooltip key={memory.id} title={fullText} arrow placement="top">
                  <MenuItem value={memory.id.toString()}>
                    {truncatedText}
                  </MenuItem>
                </Tooltip>
              );
            })
          )}
        </Select>
      </FormControl>
    </FlexFormRow>
  );
}