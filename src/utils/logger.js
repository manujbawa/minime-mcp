/**
 * Logger Utility
 * Re-exports the default logger from the logger service
 * This maintains backward compatibility while using the new modular logger service
 */

import { getDefaultLogger } from '../services/logger-service.js';

// Export the default logger instance
export default getDefaultLogger();