// Configuration Service
// Manages system configuration stored in the database

// Logger will be passed to constructor - no import needed

class ConfigService {
  constructor(databaseService, logger = console) {
    this.db = databaseService;
    this.logger = logger;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastCacheRefresh = 0;
  }

  // Initialize the service and load all configs into cache
  async initialize() {
    try {
      await this.refreshCache();
      this.logger.info('Configuration service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize configuration service:', error);
      throw error;
    }
  }

  // Refresh the configuration cache
  async refreshCache() {
    const client = await this.db.getClient();
    try {
      const result = await client.query('SELECT key, value FROM system_config');
      
      this.cache.clear();
      for (const row of result.rows) {
        this.cache.set(row.key, row.value);
      }
      
      this.lastCacheRefresh = Date.now();
      this.logger.debug(`Configuration cache refreshed with ${this.cache.size} entries`);
    } finally {
      client.release();
    }
  }

  // Check if cache needs refresh
  async checkCacheExpiry() {
    if (Date.now() - this.lastCacheRefresh > this.cacheExpiry) {
      await this.refreshCache();
    }
  }

  // Get a configuration value
  async get(key, defaultValue = null) {
    await this.checkCacheExpiry();
    
    const value = this.cache.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    
    // Parse JSON values for proper types
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return value;
    }
  }

  // Get multiple configuration values
  async getMultiple(keys) {
    await this.checkCacheExpiry();
    
    const result = {};
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    return result;
  }

  // Get all configurations
  async getAll() {
    await this.checkCacheExpiry();
    
    const result = {};
    for (const [key, value] of this.cache.entries()) {
      try {
        result[key] = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        result[key] = value;
      }
    }
    return result;
  }

  // Get configurations by category
  async getByCategory(category) {
    const client = await this.db.getClient();
    try {
      const result = await client.query(
        'SELECT key, value, description FROM system_config WHERE category = $1 ORDER BY key',
        [category]
      );
      
      const configs = {};
      for (const row of result.rows) {
        try {
          configs[row.key] = {
            value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
            description: row.description
          };
        } catch {
          configs[row.key] = {
            value: row.value,
            description: row.description
          };
        }
      }
      
      return configs;
    } finally {
      client.release();
    }
  }

  // Set a configuration value
  async set(key, value, updatedBy = 'system') {
    const client = await this.db.getClient();
    try {
      // Convert value to JSON string for storage
      const jsonValue = JSON.stringify(value);
      
      // Use INSERT ... ON CONFLICT to handle both new and existing keys
      await client.query(
        `INSERT INTO system_config (key, value, updated_by, category, description) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) 
         DO UPDATE SET 
           value = EXCLUDED.value, 
           updated_by = EXCLUDED.updated_by, 
           updated_at = CURRENT_TIMESTAMP`,
        [key, jsonValue, updatedBy, this.getConfigCategory(key), `Configuration for ${key}`]
      );
      
      // Update cache
      this.cache.set(key, value);
      
      this.logger.info(`Configuration updated: ${key} = ${jsonValue} by ${updatedBy}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update configuration ${key}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Set multiple configuration values
  async setMultiple(configs, updatedBy = 'system') {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      
      for (const [key, value] of Object.entries(configs)) {
        const jsonValue = JSON.stringify(value);
        await client.query(
          `INSERT INTO system_config (key, value, updated_by, category, description) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (key) 
           DO UPDATE SET 
             value = EXCLUDED.value, 
             updated_by = EXCLUDED.updated_by, 
             updated_at = CURRENT_TIMESTAMP`,
          [key, jsonValue, updatedBy, this.getConfigCategory(key), `Configuration for ${key}`]
        );
        this.cache.set(key, value);
      }
      
      await client.query('COMMIT');
      this.logger.info(`Multiple configurations updated by ${updatedBy}:`, Object.keys(configs));
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to update multiple configurations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Reset configurations to defaults
  async resetToDefaults(category = null) {
    const client = await this.db.getClient();
    try {
      let query = `
        UPDATE system_config 
        SET value = CASE key
          WHEN 'learning_enabled' THEN '"true"'
          WHEN 'learning_batch_size' THEN '"10"'
          WHEN 'learning_confidence_threshold' THEN '"0.7"'
          WHEN 'pattern_min_frequency' THEN '"3"'
          WHEN 'analytics_enabled' THEN '"true"'
          WHEN 'analytics_interval_minutes' THEN '"15"'
          WHEN 'analytics_retention_days' THEN '"365"'
          WHEN 'auto_tagging_enabled' THEN '"true"'
          WHEN 'thinking_sequences_enabled' THEN '"true"'
          WHEN 'task_management_enabled' THEN '"true"'
          WHEN 'max_concurrent_operations' THEN '"5"'
          WHEN 'cache_ttl_seconds' THEN '"300"'
          ELSE value
        END,
        updated_by = 'system',
        updated_at = CURRENT_TIMESTAMP
      `;
      
      if (category) {
        query += ` WHERE category = $1`;
        await client.query(query, [category]);
      } else {
        await client.query(query);
      }
      
      await this.refreshCache();
      this.logger.info(`Configuration reset to defaults${category ? ` for category: ${category}` : ''}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to reset configurations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if a feature is enabled
  async isFeatureEnabled(feature) {
    const value = await this.get(feature);
    return value === true || value === 'true';
  }

  // Get numeric configuration value
  async getNumber(key, defaultValue = 0) {
    const value = await this.get(key);
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  // Validate configuration value
  validateConfig(key, value) {
    const validations = {
      analytics_interval_minutes: (v) => {
        const num = Number(v);
        return num >= 1 && num <= 60;
      },
      learning_confidence_threshold: (v) => {
        const num = Number(v);
        return num >= 0 && num <= 1;
      },
      pattern_min_frequency: (v) => {
        const num = Number(v);
        return num >= 1 && num <= 100;
      },
      learning_batch_size: (v) => {
        const num = Number(v);
        return num >= 1 && num <= 1000;
      },
      analytics_retention_days: (v) => {
        const num = Number(v);
        return num >= 1 && num <= 365;
      },
      max_concurrent_operations: (v) => {
        const num = Number(v);
        return num >= 1 && num <= 50;
      },
      cache_ttl_seconds: (v) => {
        const num = Number(v);
        return num >= 60 && num <= 3600;
      }
    };

    const validator = validations[key];
    if (validator) {
      return validator(value);
    }

    return true;
  }

  /**
   * Determine category for a config key
   */
  getConfigCategory(key) {
    if (key.startsWith('model_') || key.includes('ollama')) return 'models';
    if (key.endsWith('_enabled')) return 'features';
    if (key.startsWith('prompt_')) return 'prompts';
    if (key.includes('analytics')) return 'analytics';
    if (key.includes('learning')) return 'learning';
    return 'settings';
  }

  // Get configuration with metadata
  async getWithMetadata() {
    const client = await this.db.getClient();
    try {
      const result = await client.query(
        `SELECT key, value, description, category, updated_at, updated_by 
         FROM system_config 
         ORDER BY category, key`
      );
      
      const configs = {};
      for (const row of result.rows) {
        if (!configs[row.category]) {
          configs[row.category] = {};
        }
        
        try {
          configs[row.category][row.key] = {
            value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
            description: row.description,
            updated_at: row.updated_at,
            updated_by: row.updated_by
          };
        } catch {
          configs[row.category][row.key] = {
            value: row.value,
            description: row.description,
            updated_at: row.updated_at,
            updated_by: row.updated_by
          };
        }
      }
      
      return configs;
    } finally {
      client.release();
    }
  }
}

export default ConfigService;