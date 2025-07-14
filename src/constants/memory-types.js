/**
 * Memory Types for MiniMe-MCP
 * Enhanced to support Memory Bank structure while preserving existing types
 */

// Existing memory types (preserve these)
export const LEGACY_MEMORY_TYPES = {
    CODE: 'code',
    DECISION: 'decision', 
    INSIGHT: 'insight',
    GENERAL: 'general',
    PROGRESS: 'progress',
    SUMMARY: 'summary',
    RELEASE_VERSION: 'release_version',
    PRD: 'prd',
    BUG: 'bug'
};

// New Memory Bank-aligned types
export const MEMORY_BANK_TYPES = {
    PROJECT_BRIEF: 'project_brief',
    PRODUCT_CONTEXT: 'product_context', 
    ACTIVE_CONTEXT: 'active_context',
    SYSTEM_PATTERNS: 'system_patterns',
    TECH_CONTEXT: 'tech_context',
    TECH_REFERENCE: 'tech_reference', // Alias for tech_context
    ARCHITECTURE: 'architecture',
    REQUIREMENTS: 'requirements',
    DESIGN_DECISIONS: 'design_decisions',
    IMPLEMENTATION_NOTES: 'implementation_notes',
    LESSONS_LEARNED: 'lessons_learned',
    TASK: 'task',
    RULE: 'rule',
    REASONING: 'reasoning',
    PROJECT_BRIEF_DOC: 'project_brief',
    PROJECT_PRD: 'project_prd',
    PROJECT_PLAN: 'project_plan'
};

// All memory types combined
export const ALL_MEMORY_TYPES = {
    ...LEGACY_MEMORY_TYPES,
    ...MEMORY_BANK_TYPES
};

// Array of all memory types (for validation)
export const MEMORY_TYPES = Object.values(ALL_MEMORY_TYPES);

// Memory type metadata for UI and validation
export const MEMORY_TYPE_METADATA = {
    // Legacy types
    [LEGACY_MEMORY_TYPES.CODE]: {
        label: 'Code',
        description: 'Code-related memories and snippets',
        color: 'primary',
        category: 'development'
    },
    [LEGACY_MEMORY_TYPES.DECISION]: {
        label: 'Decision', 
        description: 'Decisions made during development',
        color: 'info',
        category: 'planning'
    },
    [LEGACY_MEMORY_TYPES.INSIGHT]: {
        label: 'Insight',
        description: 'Insights and discoveries',
        color: 'secondary', 
        category: 'learning'
    },
    [LEGACY_MEMORY_TYPES.GENERAL]: {
        label: 'General',
        description: 'General purpose memories',
        color: 'default',
        category: 'general'
    },
    [LEGACY_MEMORY_TYPES.PROGRESS]: {
        label: 'Progress',
        description: 'Progress tracking and status updates',
        color: 'success',
        category: 'tracking'
    },
    [LEGACY_MEMORY_TYPES.SUMMARY]: {
        label: 'Summary',
        description: 'Summaries and overviews',
        color: 'info',
        category: 'documentation'
    },
    [LEGACY_MEMORY_TYPES.RELEASE_VERSION]: {
        label: 'Release Version',
        description: 'Release and version information',
        color: 'warning',
        category: 'releases'
    },
    [LEGACY_MEMORY_TYPES.PRD]: {
        label: 'PRD',
        description: 'Product requirement documents',
        color: 'primary',
        category: 'documentation'
    },
    [LEGACY_MEMORY_TYPES.BUG]: {
        label: 'Bug',
        description: 'Bug reports and fixes',
        color: 'error',
        category: 'issues'
    },

    // Memory Bank types
    [MEMORY_BANK_TYPES.PROJECT_BRIEF]: {
        label: 'Project Brief',
        description: 'Foundation document - core requirements and goals',
        color: 'primary',
        category: 'foundation',
        importance: 0.9
    },
    [MEMORY_BANK_TYPES.PRODUCT_CONTEXT]: {
        label: 'Product Context',
        description: 'Why this project exists, problems it solves',
        color: 'secondary',
        category: 'foundation',
        importance: 0.8
    },
    [MEMORY_BANK_TYPES.ACTIVE_CONTEXT]: {
        label: 'Active Context', 
        description: 'Current work focus, recent changes, next steps',
        color: 'warning',
        category: 'current',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.SYSTEM_PATTERNS]: {
        label: 'System Patterns',
        description: 'Architecture, design patterns, component relationships',
        color: 'info',
        category: 'architecture',
        importance: 0.8
    },
    [MEMORY_BANK_TYPES.TECH_CONTEXT]: {
        label: 'Tech Context',
        description: 'Technologies, setup, constraints, dependencies',
        color: 'primary',
        category: 'technical',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.TECH_REFERENCE]: {
        label: 'Tech Reference',
        description: 'Technical reference documentation and API details',
        color: 'primary',
        category: 'technical',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.ARCHITECTURE]: {
        label: 'Architecture',
        description: 'System architecture and design decisions',
        color: 'info',
        category: 'architecture',
        importance: 0.8
    },
    [MEMORY_BANK_TYPES.REQUIREMENTS]: {
        label: 'Requirements',
        description: 'Functional and non-functional requirements',
        color: 'primary',
        category: 'planning',
        importance: 0.8
    },
    [MEMORY_BANK_TYPES.DESIGN_DECISIONS]: {
        label: 'Design Decisions',
        description: 'Key design decisions and their rationale',
        color: 'secondary',
        category: 'planning',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.IMPLEMENTATION_NOTES]: {
        label: 'Implementation Notes',
        description: 'Implementation details and technical notes',
        color: 'default',
        category: 'development',
        importance: 0.6
    },
    [MEMORY_BANK_TYPES.LESSONS_LEARNED]: {
        label: 'Lessons Learned',
        description: 'Lessons learned and retrospective insights',
        color: 'success',
        category: 'learning',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.TASK]: {
        label: 'Task',
        description: 'Project tasks and action items',
        color: 'warning',
        category: 'planning',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.RULE]: {
        label: 'Rule',
        description: 'Project-specific constraints and preferences that AI agents should always follow',
        color: 'error',
        category: 'planning',
        importance: 0.9
    },
    [MEMORY_BANK_TYPES.REASONING]: {
        label: 'Reasoning',
        description: 'Sequential thinking and reasoning chains',
        color: 'info',
        category: 'planning',
        importance: 0.7
    },
    [MEMORY_BANK_TYPES.PROJECT_BRIEF_DOC]: {
        label: 'Project Brief',
        description: 'Project brief document',
        color: 'primary',
        category: 'documentation',
        importance: 0.9
    },
    [MEMORY_BANK_TYPES.PROJECT_PRD]: {
        label: 'Project PRD',
        description: 'Project requirements document',
        color: 'primary',
        category: 'documentation',
        importance: 0.9
    },
    [MEMORY_BANK_TYPES.PROJECT_PLAN]: {
        label: 'Project Plan',
        description: 'Project implementation plan',
        color: 'primary',
        category: 'documentation',
        importance: 0.8
    }
};

// Categories for grouping
export const MEMORY_CATEGORIES = {
    FOUNDATION: 'foundation',
    CURRENT: 'current', 
    ARCHITECTURE: 'architecture',
    TECHNICAL: 'technical',
    PLANNING: 'planning',
    DEVELOPMENT: 'development',
    DOCUMENTATION: 'documentation',
    LEARNING: 'learning',
    TRACKING: 'tracking',
    RELEASES: 'releases',
    ISSUES: 'issues',
    GENERAL: 'general'
};

// Helper functions
export function getMemoryTypeLabel(type) {
    return MEMORY_TYPE_METADATA[type]?.label || type;
}

export function getMemoryTypeDescription(type) {
    return MEMORY_TYPE_METADATA[type]?.description || '';
}

export function getMemoryTypeColor(type) {
    return MEMORY_TYPE_METADATA[type]?.color || 'default';
}

export function getMemoryTypeCategory(type) {
    return MEMORY_TYPE_METADATA[type]?.category || 'general';
}

export function getMemoryTypeImportance(type) {
    return MEMORY_TYPE_METADATA[type]?.importance || 0.5;
}

export function getMemoryTypesByCategory(category) {
    return Object.entries(MEMORY_TYPE_METADATA)
        .filter(([_, metadata]) => metadata.category === category)
        .map(([type, _]) => type);
}

export function getAllMemoryTypesArray() {
    return Object.values(ALL_MEMORY_TYPES);
}

export function getMemoryTypesForUI() {
    return Object.entries(MEMORY_TYPE_METADATA).map(([type, metadata]) => ({
        value: type,
        label: metadata.label,
        description: metadata.description,
        color: metadata.color,
        category: metadata.category
    }));
} 