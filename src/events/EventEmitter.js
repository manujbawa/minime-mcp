/**
 * Event Emitter
 * Central event system for decoupled communication
 */

import { EventEmitter as NodeEventEmitter } from 'events';

export class EventEmitter extends NodeEventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.eventStats = new Map();
    
    // Increase max listeners
    this.setMaxListeners(100);
    
    // Log event emissions
    this.on('newListener', (event) => {
      this.logger.debug(`[EventEmitter] New listener added for: ${event}`);
    });
    
    this.on('removeListener', (event) => {
      this.logger.debug(`[EventEmitter] Listener removed for: ${event}`);
    });
  }

  /**
   * Emit event with logging and stats
   */
  emit(event, ...args) {
    this.logger.debug(`[EventEmitter] Emitting event: ${event}`, {
      listenerCount: this.listenerCount(event)
    });
    
    // Track event stats
    const stats = this.eventStats.get(event) || { count: 0, lastEmitted: null };
    stats.count++;
    stats.lastEmitted = new Date();
    this.eventStats.set(event, stats);
    
    return super.emit(event, ...args);
  }

  /**
   * Emit async event (waits for all listeners)
   */
  async emitAsync(event, ...args) {
    const listeners = this.listeners(event);
    
    this.logger.debug(`[EventEmitter] Emitting async event: ${event}`, {
      listenerCount: listeners.length
    });
    
    const results = await Promise.allSettled(
      listeners.map(listener => listener(...args))
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.error(`[EventEmitter] ${failed.length} listeners failed for event: ${event}`, {
        errors: failed.map(f => f.reason?.message || f.reason)
      });
    }
    
    return results;
  }

  /**
   * Get event statistics
   */
  getStats() {
    const stats = {};
    
    for (const [event, data] of this.eventStats) {
      stats[event] = {
        ...data,
        currentListeners: this.listenerCount(event)
      };
    }
    
    return stats;
  }

  /**
   * Clear all listeners and stats
   */
  reset() {
    this.removeAllListeners();
    this.eventStats.clear();
    this.logger.info('[EventEmitter] Reset completed');
  }
}

// Event name constants
export const Events = {
  // Memory events
  MEMORY_CREATED: 'memory:created',
  MEMORY_UPDATED: 'memory:updated',
  MEMORY_DELETED: 'memory:deleted',
  MEMORY_EMBEDDED: 'memory:embedded',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  
  // Project events
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  
  // Learning events
  LEARNING_STARTED: 'learning:started',
  LEARNING_PROGRESS: 'learning:progress',
  LEARNING_COMPLETED: 'learning:completed',
  LEARNING_FAILED: 'learning:failed',
  PATTERN_DETECTED: 'pattern:detected',
  
  // Insight events
  INSIGHT_GENERATED: 'insight:generated',
  INSIGHT_SCHEDULED: 'insight:scheduled',
  INSIGHT_FEEDBACK: 'insight:feedback',
  
  // Job events
  JOB_STARTED: 'job:started',
  JOB_PROGRESS: 'job:progress',
  JOB_COMPLETED: 'job:completed',
  JOB_FAILED: 'job:failed',
  
  // System events
  SYSTEM_READY: 'system:ready',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SERVICE_ERROR: 'service:error',
  SERVICE_RECOVERED: 'service:recovered'
};