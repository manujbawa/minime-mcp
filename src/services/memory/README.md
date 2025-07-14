# Memory Services Module

This module provides a complete memory management solution for the MiniMe-MCP system. It handles all aspects of memory storage, search, processing, and formatting.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Services Module                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ MemoryStorage   │    │ MemorySearch    │                │
│  │ Service         │    │ Service         │                │
│  │                 │    │                 │                │
│  │ • Store         │    │ • Hybrid Search │                │
│  │ • Update        │    │ • Vector Search │                │
│  │ • Delete        │    │ • Tag Search    │                │
│  │ • Batch Ops     │    │ • Filtering     │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────────┬───────────┘                        │
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              MemoryServiceFactory                      │ │
│  │                                                        │ │
│  │ • Dependency Injection                                 │ │
│  │ • Service Configuration                                │ │
│  │ • Singleton Management                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                       │                                    │
│           ┌───────────┼───────────┐                        │
│           │           │           │                        │
│  ┌────────────┐             ┌────────────┐                │
│  │ MemoryTag  │             │ Memory     │                │
│  │ Generator  │             │ Formatter  │                │
│  │            │             │            │                │
│  │ • Pattern  │             │ • MCP      │                │
│  │ • AI Tags  │             │ • API      │                │
│  │ • Context  │             │ • UI       │                │
│  └────────────┘             └────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              MemoryBatchBuilder                        │ │
│  │                                                        │ │
│  │ • Token Management                                     │ │
│  │ • Batch Optimization                                   │ │
│  │ • Context Aggregation                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Services Overview

### Core Services

#### MemoryStorageService
**Purpose**: Primary orchestrator for memory storage operations
- **Dependencies**: Database, TagGenerator, Formatter
- **Features**:
  - Memory storage with validation
  - Duplicate detection
  - Type determination
  - Tag generation
  - Background processing
  - Batch operations

#### MemorySearchService  
**Purpose**: Unified search service for all memory operations
- **Dependencies**: Database, EmbeddingService, HybridSearchEngine
- **Features**:
  - Hybrid search (content + tags)
  - Vector similarity search
  - Advanced filtering
  - Multiple output formats
  - Search analytics

#### MemoryServiceFactory
**Purpose**: Centralized service creation with dependency injection
- **Features**:
  - Singleton management
  - Dependency injection
  - Configuration management
  - Service initialization

### Processing Services

#### MemoryTagGenerator
**Purpose**: Intelligent tag generation for memories
- **Features**:
  - Pattern-based tagging
  - AI-powered enhancement
  - Context-aware tags
  - Technology detection
  - Project-specific tags



#### MemoryBatchBuilder
**Purpose**: Optimized batching for AI processing
- **Features**:
  - Token limit management
  - Batch optimization
  - Context aggregation
  - Statistics tracking

#### MemoryFormatter
**Purpose**: Multi-format response formatting
- **Features**:
  - MCP format (rich markdown)
  - API format (clean JSON)
  - UI format (user-friendly)
  - Summary format (condensed)

## Usage Examples

### Basic Memory Storage

```javascript
import { MemoryServiceFactory } from './memory/index.js';

// Create service via factory
const memoryService = await MemoryServiceFactory.createMemoryStorageService({
  logger,
  databaseService,
  eventEmitter
});

// Store memory
const result = await memoryService.store('Code implementation details', {
  memoryType: 'code',
  projectName: 'my-project',
  tags: ['javascript', 'api'],
  format: 'mcp'
});
```

### Memory Search

```javascript
import { MemorySearchService } from './memory/index.js';

const searchService = new MemorySearchService(logger, databaseService, embeddingService);

// Hybrid search
const results = await searchService.search('authentication patterns', {
  searchMode: 'hybrid',
  contentWeight: 0.7,
  tagWeight: 0.3,
  projectName: 'my-project',
  limit: 10
});
```

### Tag Generation

```javascript
import { MemoryTagGenerator } from './memory/index.js';

const tagGenerator = new MemoryTagGenerator(logger);

const tags = await tagGenerator.generate(
  'React component with useState hook',
  'code',
  {
    projectContext: 'Frontend React application',
    useAI: true,
    maxTags: 5
  }
);
```

### Memory Formatting

```javascript
import { MemoryFormatter } from './memory/index.js';

const formatter = new MemoryFormatter(logger);

// Format for MCP tools
const mcpResult = formatter.format(memory, {
  format: 'mcp',
  project: 'my-project',
  enhancements: { stats: projectStats }
});

// Format for API
const apiResult = formatter.format(memory, {
  format: 'api',
  enhancements: { suggestions: relatedMemories }
});
```

## Integration Points

### MCP Tools Integration
```javascript
// src/services/mcp-tools-v3.js
// MCP Tools V3 uses dependency injection for all services
const mcpTools = new MCPToolsV3(logger, db, {
  memoryService: memoryStorageService,
  memorySearchService: memorySearchService,
  // ... other services
});
```

### Controller Integration
```javascript
// src/controllers/MemoryController.js
const { MemoryServiceFactory } = await import('../services/memory/memory-service-factory.js');
this.memoryStorageService = await MemoryServiceFactory.createMemoryStorageService({
  logger: this.logger,
  databaseService: this.databaseService
});
```

### Service Initializer Integration
```javascript
// src/services/service-initializer.js
import { MemorySearchService } from './memory/memory-search-service.js';
const memorySearchService = new MemorySearchService(logger, databaseService, embeddingService);
```

## Configuration

### Memory Storage Configuration
```javascript
const config = {
  enableTagGeneration: true,
  enableDuplicateDetection: true,
  enableBackgroundProcessing: true,
  maxTagsPerMemory: 5,
  duplicateThreshold: 0.95,
  importanceScoreDefault: 0.6
};
```

### Search Configuration
```javascript
const searchConfig = {
  minSimilarity: 0.7,
  maxResults: 10,
  enableHybridSearch: true,
  contentWeight: 0.7,
  tagWeight: 0.3
};
```

## Memory Types

The system supports the following memory types:
- `code` - Code implementations and snippets
- `decision` - Architecture and design decisions
- `rule` - Guidelines and constraints
- `progress` - Milestone and status updates
- `project_brief` - Project overviews and specifications
- `tech_reference` - Documentation and guides
- `general` - Miscellaneous content
- `note` - General notes and observations

## Output Formats

### MCP Format
Rich markdown with actionable information, emojis, and quick actions.

### API Format  
Clean JSON structure for HTTP responses.

### UI Format
User-friendly structure with display helpers and metadata.

### Summary Format
Condensed information for listings and previews.

## Error Handling

All services implement comprehensive error handling:
- Input validation
- Graceful degradation
- Fallback mechanisms
- Detailed error logging
- User-friendly error messages

## Testing

The module includes comprehensive test coverage:
- Unit tests for individual services
- Integration tests for service interactions
- End-to-end tests for complete workflows
- Performance tests for large datasets

## Performance Considerations

- **Batch Processing**: Optimized for large memory sets
- **Caching**: Embedding and search result caching
- **Lazy Loading**: Services initialized on demand
- **Connection Pooling**: Database connection management
- **Memory Management**: Efficient object lifecycle

## Future Enhancements

- **Machine Learning**: Enhanced type detection and tagging
- **Real-time Updates**: Live search result updates
- **Advanced Analytics**: Memory usage patterns and insights
- **Multi-language Support**: International content handling
- **Version Control**: Memory change tracking and history 