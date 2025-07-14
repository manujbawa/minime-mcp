import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../shared/useApi';
import { useErrorHandling } from '../shared/useErrorHandling';

interface TestMemory {
  id: number;
  project_id: number;
  session_id: string;
  memory_type: string;
  content: string;
  smart_tags: string[];
  metadata: any;
  created_at: string;
  project_name: string;
  contentPreview: string;
}

interface TestPrompt {
  id: number;
  prompt_name: string;
  prompt_category: string;
  prompt_template: string;
  [key: string]: any;
}

interface TestResult {
  output?: string;
  isValid?: boolean;
  parsed?: any;
  error?: string;
  model?: string;
  duration?: number;
  rawResponse?: string;
  isValidJSON?: boolean;
  jsonError?: string;
  parsedJSON?: any;
  tokenCount?: number;
}

export function usePromptTesting() {
  // State
  const [promptTestTable, setPromptTestTable] = useState<'learning' | 'task' | 'insights' | ''>('');
  const [testPrompts, setTestPrompts] = useState<TestPrompt[]>([]);
  const [selectedTestPromptId, setSelectedTestPromptId] = useState<string>('');
  const [testPromptText, setTestPromptText] = useState<string>('');
  const [testVariables, setTestVariables] = useState<string>('{}');
  const [testModel, setTestModel] = useState<string>('deepseek-coder:6.7b-instruct');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testMemories, setTestMemories] = useState<TestMemory[]>([]);
  const [selectedTestMemory, setSelectedTestMemory] = useState<string>('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string>('all');

  // Hooks
  const api = useApi();
  const { handleError } = useErrorHandling();

  // Load available models
  const loadAvailableModels = useCallback(async () => {
    try {
      console.log('Loading available models from Ollama...');
      const data = await api.get('/api/admin/ollama/models');
      console.log('Ollama models response:', data);
      
      const modelNames = data.data?.models || data.models || [];
      console.log('Available models:', modelNames);
      // Ensure it's always an array
      setAvailableModels(Array.isArray(modelNames) ? modelNames : []);
      
      // Set default model
      if (modelNames.includes('deepseek-coder:6.7b-instruct')) {
        setTestModel('deepseek-coder:6.7b-instruct');
      } else if (modelNames.length > 0 && !testModel) {
        setTestModel(modelNames[0]);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      handleError(error, 'warning');
      setAvailableModels([]);
    }
  }, [api, handleError, testModel]);

  // Load test prompts
  const loadTestPrompts = useCallback(async () => {
    try {
      if (!promptTestTable) {
        setTestPrompts([]);
        return;
      }
      
      let endpoint = '';
      if (promptTestTable === 'learning') {
        endpoint = '/api/learning/prompts';
      } else if (promptTestTable === 'task') {
        endpoint = '/api/task-extraction/prompts';
      } else if (promptTestTable === 'insights') {
        endpoint = '/api/insights/templates';
      }
      
      const data = await api.get(endpoint);
      const prompts = data.data || data || [];
      // Ensure it's always an array
      setTestPrompts(Array.isArray(prompts) ? prompts : []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      handleError(error);
      setTestPrompts([]);
    }
  }, [promptTestTable, api, handleError]);

  // Load test memories
  const loadTestMemories = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        memoryType: memoryTypeFilter,
        limit: '50'
      });
      const url = `/api/admin/test-memories?${params}`;
      console.log('Loading memories from:', url, 'Filter:', memoryTypeFilter);
      
      const data = await api.get(url);
      console.log('API Response:', data);
      const memories = data.data?.memories || data.memories || [];
      console.log('Loaded memories:', memories.length, 'for type:', memoryTypeFilter);
      
      if (memories.length > 0) {
        console.log('First memory:', memories[0]);
      }
      
      // Ensure it's always an array
      setTestMemories(Array.isArray(memories) ? memories : []);
      
      // Clear selected memory if it's not in the new list
      if (selectedTestMemory && !memories.find((m: TestMemory) => m.id === parseInt(selectedTestMemory))) {
        setSelectedTestMemory('');
      }
    } catch (error) {
      console.error('Failed to load test memories:', error);
      handleError(error);
      setTestMemories([]);
    }
  }, [memoryTypeFilter, selectedTestMemory, api, handleError]);

  // Load prompt for testing
  const loadPromptForTesting = useCallback((promptId: string) => {
    const prompt = testPrompts.find(p => p.id === parseInt(promptId));
    if (prompt) {
      // Handle different prompt structures
      const promptTemplate = prompt.prompt_template || prompt.template;
      setTestPromptText(promptTemplate);
      
      // Set default variables if no memory selected
      if (!selectedTestMemory) {
        const defaults = {
          content: "Sample content for testing",
          project_name: "test-project",
          memory_type: "code",
          content_length: "27",
          tags: "sample, test",
          document_type: "requirements"
        };
        setTestVariables(JSON.stringify(defaults, null, 2));
      }
    }
  }, [testPrompts, selectedTestMemory]);

  // Load memory for testing
  const loadMemoryForTesting = useCallback((memoryId: string) => {
    const memory = testMemories.find(m => m.id === parseInt(memoryId));
    if (memory) {
      // Helper functions for formatted descriptions
      const formatPatternCategories = () => {
        return `
1. **Code Quality Patterns**
   - Clean code practices
   - SOLID principles
   - DRY (Don't Repeat Yourself)
   - KISS (Keep It Simple, Stupid)
   - Code organization and structure

2. **Architecture Patterns**
   - MVC/MVP/MVVM patterns
   - Microservices architecture
   - Event-driven architecture
   - Layered architecture
   - Domain-driven design

3. **Design Patterns**
   - Creational patterns (Factory, Singleton, Builder)
   - Structural patterns (Adapter, Decorator, Proxy)
   - Behavioral patterns (Observer, Strategy, Command)

4. **Performance Patterns**
   - Caching strategies
   - Lazy loading
   - Database query optimization
   - Resource pooling
   - Asynchronous processing

5. **Security Patterns**
   - Authentication/Authorization patterns
   - Input validation
   - Secure communication
   - Encryption patterns
   - Security headers and CSP

6. **Testing Patterns**
   - Unit testing patterns
   - Integration testing
   - Test-driven development (TDD)
   - Behavior-driven development (BDD)
   - Mock/Stub patterns

7. **Error Handling Patterns**
   - Try-catch patterns
   - Error boundaries
   - Graceful degradation
   - Circuit breaker pattern
   - Retry patterns

8. **API Design Patterns**
   - RESTful design
   - GraphQL patterns
   - Versioning strategies
   - Rate limiting
   - Pagination patterns`;
      };

      const getTaskCategoriesDescription = () => {
        return `
- **bug_fix**: Fixes for reported issues, defects, or errors
- **feature**: New functionality or enhancements to existing features
- **refactor**: Code improvements without changing functionality
- **documentation**: Updates to docs, README, API docs, or inline comments
- **testing**: Unit tests, integration tests, test coverage improvements
- **deployment**: CI/CD, infrastructure, or deployment configuration
- **configuration**: Config files, environment variables, or settings
- **security**: Security fixes, vulnerability patches, or security improvements
- **performance**: Performance optimizations or speed improvements
- **research**: Investigation, spike work, or technical exploration`;
      };

      const getPriorityLevelsDescription = () => {
        return `
- **critical**: Production issues, blockers, or security vulnerabilities requiring immediate attention
- **high**: Important features, significant bugs, or sprint commitments needing priority
- **medium**: Standard development work, planned improvements, or non-blocking issues
- **low**: Nice-to-have features, optimizations, or technical debt that can be deferred`;
      };

      // STANDARDIZED VARIABLES - Using consistent naming across all prompts
      const variables = {
        // PRIMARY CONTENT - Always use 'content' as the main variable
        content: memory.content,
        
        // CONTEXT INFORMATION
        project_name: memory.project_name || 'Unknown Project',
        memory_type: memory.memory_type,
        content_length: memory.content.length.toString(),
        
        // METADATA
        metadata: JSON.stringify(memory.metadata || {}, null, 2),
        tags: (memory.smart_tags || []).join(', '),
        
        // TIMESTAMPS
        created_at: memory.created_at || new Date().toISOString(),
        session_id: memory.session_id || 'N/A',
        
        // PATTERN DETECTION SPECIFIC
        pattern_categories: formatPatternCategories(),
        technologies: 'To be extracted by LLM', // Will be populated by LLM
        
        // TASK EXTRACTION SPECIFIC
        document_type: memory.memory_type || 'general',
        task_categories: getTaskCategoriesDescription(),
        priority_levels: getPriorityLevelsDescription(),
        
        // AI INSIGHTS SPECIFIC
        time_period: '30 days',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        limit: '10',
        
        // VALIDATION SPECIFIC
        detected_patterns: '[]', // Empty array as placeholder for pattern validation
        
        // ADDITIONAL CONTEXT (for AI insights)
        bug_type: 'all',
        performance_category: 'general',
        code_language: 'To be detected by LLM', // Will be populated by LLM
        pattern_name: 'general patterns',
        metric_name: 'performance',
        environment: 'production',
        team_name: 'development team'
      };
      setTestVariables(JSON.stringify(variables, null, 2));
    }
  }, [testMemories]);

  // Run prompt test
  const runPromptTest = useCallback(async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const endpoint = promptTestTable === 'learning'
        ? '/api/admin/prompts/test-json'
        : '/api/admin/prompts/test-json';
      
      const response = await api.post(endpoint, {
        prompt: testPromptText,
        model: testModel,
        variables: JSON.parse(testVariables)
      });
      
      // Handle the wrapped response format
      const result = response.data || response;
      
      // Ensure we have the raw output even if JSON parsing failed
      if (!result.output && result.error) {
        result.output = result.error;
      }
      
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      let errorMessage = 'Test failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a proxy timeout error
        if (error.message.includes('aborted') || error.message.includes('timeout')) {
          errorMessage = 'Request timed out. The model may be taking too long to respond. Try a smaller/faster model or simpler prompt.';
        }
      }
      
      handleError(error);
      
      // Extract any response data from the error
      let rawOutput = errorMessage;
      if (error.response?.data) {
        rawOutput = JSON.stringify(error.response.data, null, 2);
      } else if (error.response?.text) {
        rawOutput = error.response.text;
      }
      
      setTestResult({
        error: errorMessage,
        isValid: false,
        isValidJSON: false,
        output: rawOutput,
        rawResponse: rawOutput
      });
    } finally {
      setTestLoading(false);
    }
  }, [promptTestTable, testPromptText, testModel, testVariables, api, handleError]);

  // Save prompt after successful test
  const savePromptAfterTest = useCallback(async () => {
    if (!selectedTestPromptId || !testResult?.isValid) return false;
    
    try {
      const endpoint = promptTestTable === 'learning'
        ? `/api/admin/learning-prompts/${selectedTestPromptId}`
        : `/api/admin/task-prompts/${selectedTestPromptId}`;
      
      await api.put(endpoint, {
        prompt_template: testPromptText
      });
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [selectedTestPromptId, testResult, promptTestTable, testPromptText, api, handleError]);

  // Effects
  useEffect(() => {
    loadAvailableModels();
  }, []);

  useEffect(() => {
    loadTestPrompts();
  }, [promptTestTable]);

  useEffect(() => {
    loadTestMemories();
  }, [memoryTypeFilter]);

  return {
    // State
    promptTestTable,
    testPrompts,
    selectedTestPromptId,
    testPromptText,
    testVariables,
    testModel,
    availableModels,
    testLoading,
    testResult,
    testMemories,
    selectedTestMemory,
    memoryTypeFilter,
    
    // Actions
    setPromptTestTable,
    setSelectedTestPromptId,
    setTestPromptText,
    setTestVariables,
    setTestModel,
    setSelectedTestMemory,
    setMemoryTypeFilter,
    loadPromptForTesting,
    loadMemoryForTesting,
    runPromptTest,
    savePromptAfterTest,
    loadAvailableModels,
    loadTestPrompts,
    loadTestMemories
  };
}