# Unified Insights v2 Architecture

## Overview

The Unified Insights v2 system consolidates multiple overlapping insight generation systems into a single, clean architecture. This system combines:

- L1/L2 insights (from ai_insights)
- Mini-insights (clustering-based insights)
- LLM learning pipeline
- Pattern detection
- Technology tracking

## Architecture Components

### 1. Core Service (`unified-insights-service.js`)
The main orchestrator that coordinates all insight operations:
- **Processor Management**: Determines which processors to use based on memory type
- **Enrichment Pipeline**: Adds context and relationships to insights
- **Deduplication**: Prevents duplicate insights using content signatures
- **Quality Control**: Validates insights meet minimum standards
- **Event-Driven**: Emits events for monitoring and integration

### 2. Database Schema

#### `unified_insights_v2` table
Main table storing all insights with:
- Flexible categorization (type, category, subcategory)
- Source tracking (memory, pattern, cluster, synthesis)
- Scoring (confidence, relevance, impact)
- Relationships (related, supersedes, contradicts)
- Rich metadata (technologies, patterns, entities)
- 1024-dimensional embeddings for similarity search

#### `pattern_library_v2` table
Centralized pattern storage:
- Pattern signatures and descriptions
- Usage tracking across projects
- Evolution tracking
- Example code snippets

#### `technology_tracking_v2` table
Technology preference and usage:
- Version tracking
- Preference scores
- Usage contexts
- Known issues and best practices

#### `insight_processing_queue_v2` table
Async processing queue for:
- Pattern detection
- Synthesis tasks
- Validation
- Enrichment

### 3. Processors (`processors/`)

#### Base Processor
Abstract class providing:
- Common validation
- Error handling
- Metrics collection

#### LLM Category Processor
Real-time categorization using LLM:
- Analyzes memory content
- Extracts categories and patterns
- Generates structured insights
- Uses local Ollama with deepseek-coder:6.7b

#### Processor Factory
Dynamic processor selection based on:
- Memory type
- Processing strategy
- Configuration flags

### 4. Integration

#### MCP Tools Integration (`mcp-tools-v3.js`)
- `get_insights` method enhanced to support v2
- Backward compatible with v1
- Supports multiple analysis types:
  - comprehensive
  - patterns
  - learning
  - progress
  - quality
  - productivity
  - technical_debt

#### Service Initialization
Controlled by environment variables:
- `INSIGHTS_VERSION=v2` - Enables v2 system
- `ENABLE_UNIFIED_INSIGHTS=true` - Alternative flag
- Configured in `Dockerfile.fast.v2`

## Key Features

### 1. Unified Data Model
- Single source of truth for all insights
- Consistent schema across different insight types
- Rich metadata support

### 2. Flexible Processing
- Plugin-based processor architecture
- Easy to add new insight generation methods
- Configurable processing strategies

### 3. Smart Deduplication
- Content-based signatures
- Confidence score merging
- Prevents redundant insights

### 4. Quality Assurance
- Minimum confidence thresholds
- Required field validation
- Optional validation rules

### 5. Relationship Tracking
- Related insights linking
- Supersession tracking
- Contradiction detection
- Cross-project insights

## Configuration

### Environment Variables
```bash
INSIGHTS_VERSION=v2              # Enable v2 system
ENABLE_UNIFIED_INSIGHTS=true     # Alternative flag
REAL_TIME_PROCESSING=true        # Enable real-time processing
BATCH_SIZE=10                    # Batch processing size
MAX_CONCURRENT=5                 # Concurrent processing limit
```

### Feature Flags
```javascript
{
  enrichment: {
    enablePatternMatching: true,
    enableRelationshipFinding: true,
    enableTechnologyExtraction: true
  },
  quality: {
    minConfidenceScore: 0.3,
    requireValidation: false
  }
}
```

## Migration Path

### From v1 to v2
1. Run migration SQL scripts:
   - `020_create_unified_insights_v2.sql` - Creates v2 schema
   - `021_migrate_to_unified_insights_v2_fixed.sql` - Migrates data
   - `023_final_v2_migration_fixes.sql` - Handles edge cases
   - `024_fix_embedding_dimensions.sql` - Fixes embedding dimensions

2. Enable v2 in deployment:
   ```bash
   make build-fast-v2
   ```

### Data Migration Summary
- **130 insights** migrated (94 from ai_insights + 36 from mini-insights)
- **278 patterns** from coding_patterns
- **54 technologies** from tech_preferences
- **Templates** from insight_templates_v2

## API Usage

### Get Insights
```javascript
// Using MCP tools
const insights = await mcp.get_insights({
  analysis_type: 'comprehensive',
  project_name: 'my-project',
  time_range: '7d'
});
```

### Process Memory
```javascript
// Direct service usage
const result = await unifiedInsights.processMemory(memory, {
  realTime: true,
  comprehensive: true
});
```

### Query Insights
```javascript
// Flexible querying
const results = await unifiedInsights.queryInsights({
  categories: ['architectural', 'performance'],
  minConfidence: 0.7,
  projectId: 123
});
```

## Benefits of v2

1. **Reduced Redundancy**: Eliminates overlap between 4+ insight systems
2. **Better Performance**: Single optimized schema with proper indexes
3. **Easier Maintenance**: One codebase instead of multiple systems
4. **Flexible Extension**: Plugin architecture for new processors
5. **Rich Relationships**: Track how insights relate and evolve
6. **Unified API**: Single endpoint for all insight types

## Future Enhancements

1. **Additional Processors**
   - Code quality analyzer
   - Security vulnerability detector
   - Performance bottleneck identifier

2. **Advanced Enrichment**
   - Cross-project pattern matching
   - Temporal trend analysis
   - Impact prediction

3. **Machine Learning**
   - Insight quality prediction
   - Automatic categorization improvement
   - Relevance scoring optimization

## Troubleshooting

### Common Issues

1. **Embedding Dimension Mismatch**
   - v2 uses 1024-dimensional embeddings
   - Matches current Ollama model output
   - Migration handles conversion from other dimensions

2. **Missing Insights**
   - Check confidence thresholds
   - Verify processor configuration
   - Review validation rules

3. **Performance Issues**
   - Adjust batch size and concurrency
   - Check database indexes
   - Monitor queue processing

### Debug Commands
```bash
# Check v2 status
docker exec minimemcp psql -U minime -d minime_memories -c "SELECT COUNT(*) FROM unified_insights_v2;"

# View processor logs
docker logs minimemcp | grep "UnifiedInsightsV2"

# Check configuration
docker exec minimemcp env | grep INSIGHTS
```