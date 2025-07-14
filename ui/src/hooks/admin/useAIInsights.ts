import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../shared/useApi';
import { useErrorHandling } from '../shared/useErrorHandling';

export interface AIInsightTemplate {
  id: number;
  name: string;
  category: string;
  template: string;
  variables: { [key: string]: any };
  description: string;
  is_active: boolean;
  is_public: boolean;
  project_id?: number;
  created_by?: string;
  tags: string[];
  usage_count: number;
  avg_rating: number | null;
  created_at: string;
  updated_at: string;
}

export function useAIInsights() {
  const api = useApi();
  const { handleError } = useErrorHandling();
  
  const [templates, setTemplates] = useState<AIInsightTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AIInsightTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'bugs',
    template: '',
    description: '',
    is_public: false,
    is_active: true,
    tags: [] as string[]
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showVariableMenu, setShowVariableMenu] = useState(false);
  const [variableMenuPosition, setVariableMenuPosition] = useState({ top: 0, left: 0 });
  const [currentVariableSearch, setCurrentVariableSearch] = useState('');

  // Available variables for AI insights - Organized by usage frequency
  const availableVariables = {
    'Most Common (Used in 45+ templates)': [
      'project_name',    // Used in 72 templates
      'time_period',     // Used in 65 templates
      'code_language',   // Used in 47 templates
      'team_name'        // Used in 45 templates
    ],
    'Frequently Used (10-20 templates)': [
      'bug_type',              // Used in 20 templates
      'project_type',          // Used in 16 templates
      'pattern_name',          // Used in 16 templates
      'performance_category',  // Used in 15 templates
      'last_n_days'           // Used in 10 templates
    ],
    'Occasionally Used (3-9 templates)': [
      'memory_type',      // Used in 9 templates
      'severity_level',   // Used in 7 templates
      'metric_name',      // Used in 6 templates
      'error_category',   // Used in 5 templates
      'user_role',        // Used in 4 templates
      'environment'       // Used in 4 templates
    ],
    'Rarely Used (1-3 templates)': [
      'project_description',  // Used in 3 templates
      'optimization_type',    // Used in 3 templates
      'file_extension',       // Used in 3 templates
      'threshold_value',      // Used in 2 templates
      'issue_status',         // Used in 1 template
      'format_type',          // Used in 1 template
      'limit'                 // Used in 1 template
    ]
  };

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/insights/templates');
      // Handle the wrapped API response format { success, data, message }
      const templates = response?.data || [];
      setTemplates(Array.isArray(templates) ? templates : []);
    } catch (error) {
      handleError(error, 'Failed to load AI insight templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [api, handleError]);

  useEffect(() => {
    loadTemplates();
  }, []); // Empty dependency array - loadTemplates is stable due to useCallback

  const openModal = (template?: AIInsightTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        template: template.template,
        description: template.description,
        is_public: template.is_public,
        is_active: template.is_active,
        tags: template.tags || []
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: 'bugs',
        template: '',
        description: '',
        is_public: false,
        is_active: true,
        tags: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'bugs',
      template: '',
      description: '',
      is_public: false,
      is_active: true,
      tags: []
    });
    setShowVariableMenu(false);
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      if (editingTemplate) {
        await api.put(`/api/insights/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/api/insights/templates', formData);
      }
      await loadTemplates();
      closeModal();
    } catch (error) {
      handleError(error, 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/api/insights/templates/${templateId}`);
      await loadTemplates();
    } catch (error) {
      handleError(error, 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle variable menu for template field
    if (field === 'template') {
      const lastChar = value[value.length - 1];
      if (lastChar === '{') {
        // Show variable menu
        setShowVariableMenu(true);
        setCurrentVariableSearch('');
        // Calculate position (simplified)
        setVariableMenuPosition({ top: 200, left: 100 });
      } else if (showVariableMenu) {
        // Update search if menu is open
        const lastBrace = value.lastIndexOf('{');
        if (lastBrace !== -1) {
          setCurrentVariableSearch(value.substring(lastBrace + 1));
        } else {
          setShowVariableMenu(false);
        }
      }
    }
  };

  const insertVariable = (variable: string) => {
    const currentTemplate = formData.template;
    const lastBrace = currentTemplate.lastIndexOf('{');
    const newTemplate = currentTemplate.substring(0, lastBrace) + `{${variable}}`;
    setFormData(prev => ({ ...prev, template: newTemplate }));
    setShowVariableMenu(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    templates,
    loading,
    showModal,
    editingTemplate,
    formData,
    page,
    rowsPerPage,
    showVariableMenu,
    variableMenuPosition,
    currentVariableSearch,
    availableVariables,
    openModal,
    closeModal,
    saveTemplate,
    deleteTemplate,
    updateFormField,
    insertVariable,
    handleChangePage,
    handleChangeRowsPerPage
  };
}