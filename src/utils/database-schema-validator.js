/**
 * Database Schema Validator
 * Systematically checks for schema consistency issues between code and database
 */

class DatabaseSchemaValidator {
    constructor(dbPool, logger) {
        this.db = dbPool;
        this.logger = logger;
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Run comprehensive schema validation
     */
    async validateSchema() {
        this.logger.info('Starting comprehensive database schema validation...');
        
        this.errors = [];
        this.warnings = [];

        // Core table validations
        await this.validateCoreTableStructure();
        await this.validateColumnConsistency();
        await this.validateIndexes();
        await this.validateConstraints();
        await this.validateMissingTables();
        
        // Generate report
        return this.generateValidationReport();
    }

    /**
     * Validate core table structures
     */
    async validateCoreTableStructure() {
        const requiredTables = [
            'projects',
            'sessions', 
            'memories',
            'thinking_sequences',
            'thoughts',
            'embedding_models',
            'insight_processing_queue_v2',
            'analytics_snapshots',
            // Meta-learning tables
            'coding_patterns',
            'unified_insights_v2',
            'decision_patterns',
            'tech_preferences',
            'solution_patterns',
            'learning_evolution'
        ];

        this.logger.info('Validating core table structure...');

        for (const table of requiredTables) {
            try {
                const result = await this.db.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_name = $1 AND table_schema = 'public'
                `, [table]);

                if (result.rows[0].count === '0') {
                    this.errors.push(`MISSING_TABLE: Required table '${table}' does not exist`);
                }
            } catch (error) {
                this.errors.push(`TABLE_CHECK_ERROR: Failed to check table '${table}': ${error.message}`);
            }
        }
    }

    /**
     * Validate column consistency
     */
    async validateColumnConsistency() {
        this.logger.info('Validating column consistency...');

        // Check memories table has correct columns
        const memoryColumns = await this.getTableColumns('memories');
        
        const requiredMemoryColumns = [
            'id', 'project_id', 'session_id', 'content', 'memory_type',
            'embedding', 'embedding_model', 'embedding_dimensions', 
            'importance_score', 'tags', 'metadata', 'created_at', 'updated_at'
        ];

        for (const column of requiredMemoryColumns) {
            if (!memoryColumns.includes(column)) {
                this.errors.push(`MISSING_COLUMN: memories table missing column '${column}'`);
            }
        }

        // Check projects table structure
        const projectColumns = await this.getTableColumns('projects');
        
        const requiredProjectColumns = ['id', 'name', 'description', 'settings', 'created_at', 'updated_at'];
        
        for (const column of requiredProjectColumns) {
            if (!projectColumns.includes(column)) {
                this.errors.push(`MISSING_COLUMN: projects table missing column '${column}'`);
            }
        }

        // Validate importance_score vs importance consistency
        if (memoryColumns.includes('importance') && memoryColumns.includes('importance_score')) {
            this.warnings.push(`DUPLICATE_COLUMNS: memories table has both 'importance' and 'importance_score' columns`);
        } else if (memoryColumns.includes('importance') && !memoryColumns.includes('importance_score')) {
            this.errors.push(`WRONG_COLUMN: memories table has 'importance' but should have 'importance_score'`);
        }
    }

    /**
     * Validate critical indexes exist
     */
    async validateIndexes() {
        this.logger.info('Validating critical indexes...');

        const criticalIndexes = [
            { table: 'memories', column: 'project_id', name: 'idx_memories_project_id' },
            { table: 'memories', column: 'memory_type', name: 'idx_memories_type' },
            { table: 'memories', column: 'importance_score', name: 'idx_memories_importance' },
            { table: 'memories', column: 'created_at', name: 'idx_memories_created_at' },
            { table: 'sessions', column: 'project_id', name: 'idx_sessions_project_id' },
            { table: 'thinking_sequences', column: 'project_id', name: 'idx_thinking_seq_project_id' }
        ];

        for (const index of criticalIndexes) {
            try {
                const result = await this.db.query(`
                    SELECT COUNT(*) as count
                    FROM pg_indexes 
                    WHERE tablename = $1 AND indexname = $2
                `, [index.table, index.name]);

                if (result.rows[0].count === '0') {
                    this.warnings.push(`MISSING_INDEX: Critical index '${index.name}' missing on ${index.table}.${index.column}`);
                }
            } catch (error) {
                this.warnings.push(`INDEX_CHECK_ERROR: Failed to check index '${index.name}': ${error.message}`);
            }
        }
    }

    /**
     * Validate foreign key constraints
     */
    async validateConstraints() {
        this.logger.info('Validating foreign key constraints...');

        const criticalConstraints = [
            { table: 'memories', column: 'project_id', ref_table: 'projects' },
            { table: 'memories', column: 'session_id', ref_table: 'sessions' },
            { table: 'sessions', column: 'project_id', ref_table: 'projects' },
            { table: 'thinking_sequences', column: 'project_id', ref_table: 'projects' },
            { table: 'thoughts', column: 'sequence_id', ref_table: 'thinking_sequences' }
        ];

        for (const constraint of criticalConstraints) {
            try {
                const result = await this.db.query(`
                    SELECT COUNT(*) as count
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage ccu 
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_name = $1
                        AND kcu.column_name = $2
                        AND ccu.table_name = $3
                `, [constraint.table, constraint.column, constraint.ref_table]);

                if (result.rows[0].count === '0') {
                    this.errors.push(`MISSING_CONSTRAINT: Foreign key constraint missing: ${constraint.table}.${constraint.column} -> ${constraint.ref_table}`);
                }
            } catch (error) {
                this.warnings.push(`CONSTRAINT_CHECK_ERROR: Failed to check constraint on ${constraint.table}.${constraint.column}: ${error.message}`);
            }
        }
    }

    /**
     * Check for missing tables that should exist based on schema
     */
    async validateMissingTables() {
        this.logger.info('Checking for missing tables...');

        // Check if analytics_snapshots exists (was mentioned as missing in bug reports)
        const analyticsExists = await this.tableExists('analytics_snapshots');
        if (!analyticsExists) {
            this.errors.push(`CRITICAL_MISSING_TABLE: analytics_snapshots table is missing (required for meta-learning pipeline)`);
        }

        // Check if learning_processing_queue exists
        const queueExists = await this.tableExists('learning_processing_queue');
        if (!queueExists) {
            this.errors.push(`CRITICAL_MISSING_TABLE: learning_processing_queue table is missing (required for learning pipeline)`);
        }
    }

    /**
     * Helper: Get table columns
     */
    async getTableColumns(tableName) {
        try {
            const result = await this.db.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [tableName]);

            return result.rows.map(row => row.column_name);
        } catch (error) {
            this.logger.error(`Failed to get columns for table ${tableName}:`, error);
            return [];
        }
    }

    /**
     * Helper: Check if table exists
     */
    async tableExists(tableName) {
        try {
            const result = await this.db.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = $1 AND table_schema = 'public'
            `, [tableName]);

            return result.rows[0].count > 0;
        } catch (error) {
            this.logger.error(`Failed to check if table ${tableName} exists:`, error);
            return false;
        }
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: this.errors.length === 0 ? 'PASS' : 'FAIL',
            summary: {
                total_errors: this.errors.length,
                total_warnings: this.warnings.length,
                critical_issues: this.errors.filter(e => e.includes('CRITICAL')).length
            },
            errors: this.errors,
            warnings: this.warnings,
            recommendations: this.generateRecommendations()
        };

        this.logger.info(`Schema validation completed: ${report.status}`, {
            errors: report.summary.total_errors,
            warnings: report.summary.total_warnings
        });

        return report;
    }

    /**
     * Generate fix recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.errors.some(e => e.includes('MISSING_TABLE'))) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Run database migration to create missing tables',
                command: 'Apply the complete schema.sql file to restore missing tables'
            });
        }

        if (this.errors.some(e => e.includes('MISSING_COLUMN'))) {
            recommendations.push({
                priority: 'HIGH', 
                action: 'Add missing columns to existing tables',
                command: 'Run ALTER TABLE statements to add missing columns'
            });
        }

        if (this.warnings.some(w => w.includes('MISSING_INDEX'))) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Create missing performance indexes',
                command: 'Run CREATE INDEX statements for better query performance'
            });
        }

        if (this.errors.some(e => e.includes('importance_score'))) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Fix column name consistency in application code',
                command: 'Update all code references from "importance" to "importance_score"'
            });
        }

        return recommendations;
    }

    /**
     * Quick validation for most common issues
     */
    async quickValidation() {
        this.logger.info('Running quick schema validation...');
        
        const issues = [];

        // Check importance_score column
        const memoryColumns = await this.getTableColumns('memories');
        if (!memoryColumns.includes('importance_score')) {
            issues.push('CRITICAL: memories table missing importance_score column');
        }

        // Check analytics_snapshots table
        if (!(await this.tableExists('analytics_snapshots'))) {
            issues.push('CRITICAL: analytics_snapshots table missing');
        }

        // Check learning_processing_queue table  
        if (!(await this.tableExists('learning_processing_queue'))) {
            issues.push('CRITICAL: learning_processing_queue table missing');
        }

        return {
            status: issues.length === 0 ? 'PASS' : 'FAIL',
            issues,
            recommendations: issues.length > 0 ? ['Run full schema validation with validateSchema()'] : []
        };
    }
}

export { DatabaseSchemaValidator }; 