/**
 * Utility functions for MiniMe-MCP
 */

/**
 * Validate embedding dimensions
 * @param {number} dimensions 
 * @returns {boolean}
 */
export function validateEmbeddingDimensions(dimensions) {
    return typeof dimensions === 'number' && dimensions > 0 && dimensions <= 4096;
}

/**
 * Calculate vector cosine similarity
 * @param {number[]} vectorA 
 * @param {number[]} vectorB 
 * @returns {number}
 */
export function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Sanitize text for embedding
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeText(text) {
    return text.trim().replace(/\s+/g, ' ');
}

/**
 * Generate unique task ID
 * @returns {string}
 */
export function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}