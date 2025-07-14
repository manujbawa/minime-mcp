/**
 * SSE Routes
 * Server-Sent Events endpoints
 */

import { ResponseUtil } from '../utils/response.js';

export default function sseRoutes(app, services) {
  const { logger, eventEmitter } = services;
  
  // Active SSE connections
  const sseClients = new Map();

  /**
   * SSE endpoint for real-time updates
   */
  app.get('/api/sse/events', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Generate client ID
    const clientId = Math.random().toString(36).substring(7);
    
    // Store client connection
    sseClients.set(clientId, res);
    
    logger.info(`[SSE] Client connected: ${clientId}`);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ 
      type: 'connected', 
      clientId,
      timestamp: new Date().toISOString() 
    })}\n\n`);

    // Set up event listeners
    const eventHandlers = {
      'memory:created': (data) => sendEvent(res, 'memory:created', data),
      'memory:updated': (data) => sendEvent(res, 'memory:updated', data),
      'memory:deleted': (data) => sendEvent(res, 'memory:deleted', data),
      'task:created': (data) => sendEvent(res, 'task:created', data),
      'task:updated': (data) => sendEvent(res, 'task:updated', data),
      'task:completed': (data) => sendEvent(res, 'task:completed', data),
      'insight:generated': (data) => sendEvent(res, 'insight:generated', data),
      'learning:progress': (data) => sendEvent(res, 'learning:progress', data),
      'job:started': (data) => sendEvent(res, 'job:started', data),
      'job:completed': (data) => sendEvent(res, 'job:completed', data),
      'job:failed': (data) => sendEvent(res, 'job:failed', data)
    };

    // Register event listeners
    if (eventEmitter) {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        eventEmitter.on(event, handler);
      });
    }

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(':ping\n\n');
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
      
      // Remove event listeners
      if (eventEmitter) {
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          eventEmitter.off(event, handler);
        });
      }
      
      logger.info(`[SSE] Client disconnected: ${clientId}`);
    });
  });

  /**
   * Send event to specific client
   */
  app.post('/api/sse/send/:clientId', (req, res) => {
    const { clientId } = req.params;
    const { event, data } = req.body;

    const client = sseClients.get(clientId);
    if (!client) {
      return res.status(404).json(
        ResponseUtil.error('Client not found')
      );
    }

    sendEvent(client, event, data);
    res.json(ResponseUtil.success({ sent: true }));
  });

  /**
   * Broadcast event to all clients
   */
  app.post('/api/sse/broadcast', (req, res) => {
    const { event, data } = req.body;

    let sent = 0;
    sseClients.forEach((client) => {
      sendEvent(client, event, data);
      sent++;
    });

    res.json(ResponseUtil.success({ 
      sent, 
      totalClients: sseClients.size 
    }));
  });

  /**
   * Get connected clients
   */
  app.get('/api/sse/clients', (req, res) => {
    const clients = Array.from(sseClients.keys()).map(id => ({
      id,
      connected: true
    }));

    res.json(ResponseUtil.success({ 
      clients,
      total: sseClients.size 
    }));
  });
}

/**
 * Helper function to send SSE event
 */
function sendEvent(res, event, data) {
  const eventData = {
    timestamp: new Date().toISOString(),
    ...data
  };

  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(eventData)}\n\n`);
}