import { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useErrorHandling } from './useErrorHandling';
import { 
  PromptsApi,
  LearningPrompt,
  AIPromptTemplate,
  CreateLearningPromptRequest,
  UpdateLearningPromptRequest,
  CreateAITemplateRequest,
  UpdateAITemplateRequest,
  PromptTestRequest,
  PromptTestResponse
} from '../services/api';

interface UsePromptManagementReturn {
  // Learning Prompts
  learningPrompts: LearningPrompt[];
  loadingLearning: boolean;
  
  // AI Templates
  aiTemplates: AIPromptTemplate[];
  loadingTemplates: boolean;
  
  // Test data
  testMemories: any[];
  ollamaModels: string[];
  loadingTest: boolean;
  testResult: PromptTestResponse | null;
  
  // Actions
  loadLearningPrompts: (params?: { category?: string; isActive?: boolean }) => Promise<void>;
  createLearningPrompt: (data: CreateLearningPromptRequest) => Promise<void>;
  updateLearningPrompt: (id: number, data: UpdateLearningPromptRequest) => Promise<void>;
  deleteLearningPrompt: (id: number) => Promise<void>;
  
  loadAITemplates: (params?: { category?: string; isActive?: boolean; isPublic?: boolean }) => Promise<void>;
  createAITemplate: (data: CreateAITemplateRequest) => Promise<void>;
  updateAITemplate: (id: number, data: UpdateAITemplateRequest) => Promise<void>;
  deleteAITemplate: (id: number) => Promise<void>;
  
  loadTestData: () => Promise<void>;
  testPrompt: (data: PromptTestRequest) => Promise<void>;
  clearTestResult: () => void;
  
  // Utilities
  refreshAll: () => Promise<void>;
}

export function usePromptManagement(): UsePromptManagementReturn {
  const { showNotification } = useAppContext();
  const { handleError } = useErrorHandling();
  
  // Learning Prompts state
  const [learningPrompts, setLearningPrompts] = useState<LearningPrompt[]>([]);
  const [loadingLearning, setLoadingLearning] = useState(false);
  
  // AI Templates state
  const [aiTemplates, setAITemplates] = useState<AIPromptTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Test data state
  const [testMemories, setTestMemories] = useState<any[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingTest, setLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState<PromptTestResponse | null>(null);
  
  // Learning Prompts actions
  const loadLearningPrompts = useCallback(async (params?: { category?: string; isActive?: boolean }) => {
    setLoadingLearning(true);
    try {
      const response = await PromptsApi.getLearningPrompts(params);
      if (response.success && response.data) {
        setLearningPrompts(response.data);
      }
    } catch (error) {
      handleError(error, 'error');
    } finally {
      setLoadingLearning(false);
    }
  }, [handleError]);
  
  const createLearningPrompt = useCallback(async (data: CreateLearningPromptRequest) => {
    try {
      const response = await PromptsApi.createLearningPrompt(data);
      if (response.success) {
        showNotification('Learning prompt created successfully', 'success');
        await loadLearningPrompts();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadLearningPrompts]);
  
  const updateLearningPrompt = useCallback(async (id: number, data: UpdateLearningPromptRequest) => {
    try {
      const response = await PromptsApi.updateLearningPrompt(id, data);
      if (response.success) {
        showNotification('Learning prompt updated successfully', 'success');
        await loadLearningPrompts();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadLearningPrompts]);
  
  const deleteLearningPrompt = useCallback(async (id: number) => {
    try {
      const response = await PromptsApi.deleteLearningPrompt(id);
      if (response.success) {
        showNotification('Learning prompt deleted successfully', 'success');
        await loadLearningPrompts();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadLearningPrompts]);
  
  // AI Templates actions
  const loadAITemplates = useCallback(async (params?: { 
    category?: string; 
    isActive?: boolean; 
    isPublic?: boolean 
  }) => {
    setLoadingTemplates(true);
    try {
      const response = await PromptsApi.getAITemplates(params);
      if (response.success && response.data) {
        setAITemplates(response.data);
      }
    } catch (error) {
      handleError(error, 'error');
    } finally {
      setLoadingTemplates(false);
    }
  }, [handleError]);
  
  const createAITemplate = useCallback(async (data: CreateAITemplateRequest) => {
    try {
      const response = await PromptsApi.createAITemplate(data);
      if (response.success) {
        showNotification('AI template created successfully', 'success');
        await loadAITemplates();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadAITemplates]);
  
  const updateAITemplate = useCallback(async (id: number, data: UpdateAITemplateRequest) => {
    try {
      const response = await PromptsApi.updateAITemplate(id, data);
      if (response.success) {
        showNotification('AI template updated successfully', 'success');
        await loadAITemplates();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadAITemplates]);
  
  const deleteAITemplate = useCallback(async (id: number) => {
    try {
      const response = await PromptsApi.deleteAITemplate(id);
      if (response.success) {
        showNotification('AI template deleted successfully', 'success');
        await loadAITemplates();
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    }
  }, [showNotification, handleError, loadAITemplates]);
  
  // Test data actions
  const loadTestData = useCallback(async () => {
    setLoadingTest(true);
    try {
      const [memoriesResponse, modelsResponse] = await Promise.all([
        PromptsApi.getTestMemories(10),
        PromptsApi.getOllamaModels()
      ]);
      
      if (memoriesResponse.success && memoriesResponse.data) {
        setTestMemories(memoriesResponse.data);
      }
      
      if (modelsResponse.success && modelsResponse.data) {
        setOllamaModels(modelsResponse.data.models || []);
      }
    } catch (error) {
      handleError(error, 'warning');
    } finally {
      setLoadingTest(false);
    }
  }, [handleError]);
  
  const testPrompt = useCallback(async (data: PromptTestRequest) => {
    setLoadingTest(true);
    try {
      const response = await PromptsApi.testPrompt(data);
      if (response.success && response.data) {
        setTestResult(response.data);
        showNotification('Prompt tested successfully', 'success');
      }
    } catch (error) {
      handleError(error, 'error');
      throw error;
    } finally {
      setLoadingTest(false);
    }
  }, [showNotification, handleError]);
  
  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadLearningPrompts(),
      loadAITemplates(),
      loadTestData()
    ]);
  }, [loadLearningPrompts, loadAITemplates, loadTestData]);
  
  return {
    // State
    learningPrompts,
    loadingLearning,
    aiTemplates,
    loadingTemplates,
    testMemories,
    ollamaModels,
    loadingTest,
    testResult,
    
    // Actions
    loadLearningPrompts,
    createLearningPrompt,
    updateLearningPrompt,
    deleteLearningPrompt,
    
    loadAITemplates,
    createAITemplate,
    updateAITemplate,
    deleteAITemplate,
    
    loadTestData,
    testPrompt,
    clearTestResult,
    
    // Utilities
    refreshAll
  };
}