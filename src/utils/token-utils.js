/**
 * Token Utility Module
 * Handles token counting and management for LLM context windows
 */

class TokenUtils {
  constructor(config = {}) {
    this.config = {
      maxContextTokens: config.maxContextTokens || 4000,
      maxResponseTokens: config.maxResponseTokens || 500,
      tokenSafetyMargin: config.tokenSafetyMargin || 0.9,
      // Using cl100k_base encoding approximation
      avgCharsPerToken: config.avgCharsPerToken || 4
    };
  }

  /**
   * Estimate token count for a given text
   * @param {string} text - Text to count tokens for
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    
    // Basic estimation: ~4 characters per token for English
    // For more accuracy, integrate tiktoken or similar
    const baseEstimate = text.length / this.config.avgCharsPerToken;
    
    // Add 10% buffer for special characters, formatting
    return Math.ceil(baseEstimate * 1.1);
  }

  /**
   * Calculate available tokens for content given a template
   * @param {string} template - The prompt template
   * @returns {number} Available tokens for content
   */
  calculateAvailableTokens(template) {
    const templateTokens = this.estimateTokens(template);
    const maxUsableTokens = this.config.maxContextTokens * this.config.tokenSafetyMargin;
    return Math.floor(maxUsableTokens - templateTokens - this.config.maxResponseTokens);
  }

  /**
   * Check if content fits within token limit
   * @param {string} content - Content to check
   * @param {number} availableTokens - Available token budget
   * @returns {boolean} Whether content fits
   */
  fitsWithinLimit(content, availableTokens) {
    return this.estimateTokens(content) <= availableTokens;
  }

  /**
   * Truncate text to fit within token limit
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum tokens allowed
   * @returns {string} Truncated text
   */
  truncateToTokenLimit(text, maxTokens) {
    const estimatedChars = maxTokens * this.config.avgCharsPerToken * 0.9; // Safety margin
    if (text.length <= estimatedChars) return text;
    
    return text.substring(0, estimatedChars) + '...';
  }
}

export { TokenUtils };
export default TokenUtils;