/**
 * JSON Schema Validator for MCP Tools
 * Validates tool arguments against their defined schemas
 */

export class SchemaValidator {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Validate arguments against a JSON Schema
     * @param {Object} args - The arguments to validate
     * @param {Object} schema - The JSON Schema
     * @param {string} toolName - Name of the tool (for error messages)
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    validate(args, schema, toolName) {
        const errors = [];
        
        if (!schema || !schema.properties) {
            return { valid: true, errors: [] };
        }

        // Check required properties
        if (schema.required && Array.isArray(schema.required)) {
            for (const required of schema.required) {
                if (args[required] === undefined || args[required] === null) {
                    errors.push(`Missing required parameter: ${required}`);
                }
            }
        }

        // Validate each property
        for (const [key, value] of Object.entries(args)) {
            const propSchema = schema.properties[key];
            
            if (!propSchema) {
                // Skip unknown properties - they're allowed unless additionalProperties is false
                if (schema.additionalProperties === false) {
                    errors.push(`Unknown parameter: ${key}`);
                }
                continue;
            }

            // Type validation
            const typeError = this._validateType(value, propSchema, key);
            if (typeError) {
                errors.push(typeError);
            }

            // Enum validation
            if (propSchema.enum && !propSchema.enum.includes(value)) {
                errors.push(`Invalid value for ${key}: must be one of [${propSchema.enum.join(', ')}]`);
            }

            // String validation
            if (propSchema.type === 'string') {
                if (propSchema.minLength && value.length < propSchema.minLength) {
                    errors.push(`${key} must be at least ${propSchema.minLength} characters`);
                }
                if (propSchema.maxLength && value.length > propSchema.maxLength) {
                    errors.push(`${key} must be at most ${propSchema.maxLength} characters`);
                }
                if (propSchema.pattern) {
                    const regex = new RegExp(propSchema.pattern);
                    if (!regex.test(value)) {
                        errors.push(`${key} does not match required pattern: ${propSchema.pattern}`);
                    }
                }
            }

            // Number validation
            if (propSchema.type === 'number') {
                if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                    errors.push(`${key} must be at least ${propSchema.minimum}`);
                }
                if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                    errors.push(`${key} must be at most ${propSchema.maximum}`);
                }
            }

            // Array validation
            if (propSchema.type === 'array') {
                if (propSchema.minItems && value.length < propSchema.minItems) {
                    errors.push(`${key} must have at least ${propSchema.minItems} items`);
                }
                if (propSchema.maxItems && value.length > propSchema.maxItems) {
                    errors.push(`${key} must have at most ${propSchema.maxItems} items`);
                }
                if (propSchema.items) {
                    // Validate each array item
                    for (let i = 0; i < value.length; i++) {
                        const itemError = this._validateType(value[i], propSchema.items, `${key}[${i}]`);
                        if (itemError) {
                            errors.push(itemError);
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            this.logger.debug(`Validation failed for ${toolName}:`, errors);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate value type
     */
    _validateType(value, schema, path) {
        const expectedType = schema.type;
        const actualType = this._getType(value);

        if (expectedType && actualType !== expectedType) {
            // Special case: number can be integer
            if (expectedType === 'integer' && actualType === 'number' && Number.isInteger(value)) {
                return null;
            }
            return `${path} must be of type ${expectedType}, got ${actualType}`;
        }

        return null;
    }

    /**
     * Get JavaScript type for JSON Schema
     */
    _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }
}

export default SchemaValidator;