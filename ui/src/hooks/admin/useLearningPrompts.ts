import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../shared/useApi';
import { useErrorHandling } from '../shared/useErrorHandling';

export interface LearningPromptTemplate {
  id: number;
  prompt_name: string;
  prompt_category: string;
  prompt_type: string;
  prompt_template: string;
  description: string;
  applicable_memory_types: string[] | null;
  configuration: any;
  variables: any;
  output_schema?: any;
  success_criteria?: any;
  examples: any;
  is_active: boolean;
  priority: number;
  version: number;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface LearningPromptFormData {
  prompt_name: string;
  prompt_category: string;
  prompt_type: string;
  prompt_template: string;
  description: string;
  applicable_memory_types: string[] | null;
  configuration: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  is_active: boolean;
  priority: number;
}

const defaultFormData: LearningPromptFormData = {
  prompt_name: '',
  prompt_category: 'pattern_detection',
  prompt_type: 'general',
  prompt_template: '',
  description: '',
  applicable_memory_types: null,
  configuration: {
    temperature: 0.1,
    max_tokens: 2000
  },
  is_active: true,
  priority: 10
};

export function useLearningPrompts() {
  // State
  const [prompts, setPrompts] = useState<LearningPromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<LearningPromptTemplate | null>(null);
  const [formData, setFormData] = useState<LearningPromptFormData>(defaultFormData);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Hooks
  const api = useApi();
  const { handleError, showSuccess } = useErrorHandling();

  // Load prompts
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/learning/prompts');
      // Handle the wrapped API response format { success, data, message }
      const prompts = response?.data || [];
      setPrompts(Array.isArray(prompts) ? prompts : []);
    } catch (error) {
      handleError(error);
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [api, handleError]);

  // Open modal
  const openModal = useCallback((prompt?: LearningPromptTemplate) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({
        prompt_name: prompt.prompt_name,
        prompt_category: prompt.prompt_category,
        prompt_type: prompt.prompt_type,
        prompt_template: prompt.prompt_template,
        description: prompt.description,
        applicable_memory_types: prompt.applicable_memory_types,
        configuration: prompt.configuration || { temperature: 0.1, max_tokens: 2000 },
        is_active: prompt.is_active,
        priority: prompt.priority
      });
    } else {
      setEditingPrompt(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingPrompt(null);
    setFormData(defaultFormData);
  }, []);

  // Save prompt
  const savePrompt = useCallback(async () => {
    try {
      const endpoint = editingPrompt
        ? `/api/learning/prompts/${editingPrompt.id}`
        : '/api/learning/prompts';
      
      const method = editingPrompt ? 'PUT' : 'POST';
      
      await api.request(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      showSuccess(editingPrompt ? 'Prompt updated successfully' : 'Prompt created successfully');
      closeModal();
      loadPrompts();
    } catch (error) {
      handleError(error);
    }
  }, [editingPrompt, formData, api, showSuccess, closeModal, loadPrompts, handleError]);

  // Delete prompt
  const deletePrompt = useCallback(async (promptId: number) => {
    if (!confirm('Are you sure you want to delete this prompt template?')) {
      return;
    }

    try {
      await api.delete(`/api/learning/prompts/${promptId}`);
      showSuccess('Prompt deleted successfully');
      loadPrompts();
    } catch (error) {
      handleError(error);
    }
  }, [api, showSuccess, loadPrompts, handleError]);

  // Update form field
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update configuration field
  const updateConfigField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value
      }
    }));
  }, []);

  // Pagination
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []); // Empty dependency array to only run once on mount

  return {
    // State
    prompts,
    loading,
    showModal,
    editingPrompt,
    formData,
    page,
    rowsPerPage,
    
    // Actions
    loadPrompts,
    openModal,
    closeModal,
    savePrompt,
    deletePrompt,
    updateFormField,
    updateConfigField,
    handleChangePage,
    handleChangeRowsPerPage
  };
}