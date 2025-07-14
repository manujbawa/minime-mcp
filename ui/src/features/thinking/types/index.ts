/**
 * Sequential Thinking Types
 */

import type { Thought as GlobalThought, ThinkingSequence as GlobalThinkingSequence } from '../../../types';

// Re-export the global types
export type Thought = GlobalThought;
export type ThinkingSequence = GlobalThinkingSequence & {
  total_thoughts?: number;
  conclusion?: string;
  confidence_score?: number;
  branches?: Record<string, any>;
};

export interface ThoughtTypeConfig {
  color: string;
  icon: string;
  label: string;
}

export const thoughtTypeConfig: Record<string, ThoughtTypeConfig> = {
  analysis: { color: '#2196F3', icon: '🔍', label: 'Analysis' },
  hypothesis: { color: '#9C27B0', icon: '💡', label: 'Hypothesis' },
  decision: { color: '#4CAF50', icon: '⚖️', label: 'Decision' },
  action: { color: '#FF9800', icon: '⚡', label: 'Action' },
  reflection: { color: '#F44336', icon: '🤔', label: 'Reflection' },
  reasoning: { color: '#2196F3', icon: '🔍', label: 'Reasoning' },
  conclusion: { color: '#4CAF50', icon: '⚖️', label: 'Conclusion' },
  question: { color: '#FF9800', icon: '❓', label: 'Question' },
  observation: { color: '#F44336', icon: '👁️', label: 'Observation' },
  assumption: { color: '#795548', icon: '🤔', label: 'Assumption' },
  default: { color: '#757575', icon: '💭', label: 'Thought' }
};