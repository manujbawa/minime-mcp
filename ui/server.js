import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
const LOG_PREFIX = '[UI-SERVER]';
const log = {
  info: (...args) => console.log(`${LOG_PREFIX} ${new Date().toISOString()} INFO:`, ...args),
  error: (...args) => console.error(`${LOG_PREFIX} ${new Date().toISOString()} ERROR:`, ...args),
  debug: (...args) => console.log(`${LOG_PREFIX} ${new Date().toISOString()} DEBUG:`, ...args),
  warn: (...args) => console.warn(`${LOG_PREFIX} ${new Date().toISOString()} WARN:`, ...args)
};

const app = express();
const PORT = process.env.UI_PORT || 9000;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

log.info('Starting UI Server configuration');
log.info(`UI Server will run on port: ${PORT}`);
log.info(`MCP Server URL: ${MCP_SERVER_URL}`);

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  log.debug(`${req.method} ${req.path}`);
  next();
});

// Serve static files with /ui prefix to match vite build
const distPath = path.join(__dirname, 'dist');
log.info(`Serving static files from: ${distPath}`);

app.use('/ui', express.static(distPath));

// Parse JSON bodies for API proxy
app.use(express.json());

// Special case for health endpoint - map /api/health to /health
app.get('/api/health', async (req, res) => {
  const targetUrl = `${MCP_SERVER_URL}/health`;
  log.info(`Proxying health request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.set(key, value);
    });
    
    res.send(data);
    log.debug(`Health proxy response: ${response.status} for ${req.originalUrl}`);
  } catch (error) {
    log.error(`Health proxy error for ${req.originalUrl}:`, error.message);
    res.status(500).json({ error: 'Health proxy failed', message: error.message });
  }
});

// MCP protocol endpoints proxy 
app.use('/mcp', async (req, res) => {
  const targetUrl = `${MCP_SERVER_URL}/mcp${req.url}`;
  log.info(`Proxying MCP request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };
    
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.set(key, value);
    });
    
    res.send(data);
    log.debug(`MCP proxy response: ${response.status} for ${req.originalUrl}`);
  } catch (error) {
    log.error(`MCP proxy error for ${req.originalUrl}:`, error.message);
    res.status(500).json({ error: 'MCP proxy failed', message: error.message });
  }
});

// SSE proxy endpoint - special handling for Server-Sent Events
app.get('/api/sse/events', async (req, res) => {
  const targetUrl = `${MCP_SERVER_URL}/api/sse/events`;
  log.info(`Proxying SSE connection: ${req.originalUrl} -> ${targetUrl}`);
  
  try {
    // Use http module for proper streaming support
    const http = await import('http');
    const url = new URL(targetUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Forward SSE headers
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Pipe the response
      proxyRes.pipe(res);

      // Handle proxy response end
      proxyRes.on('end', () => {
        res.end();
      });

      // Handle proxy errors
      proxyRes.on('error', (error) => {
        log.error('SSE proxy stream error:', error);
        res.end();
      });
    });

    // Handle proxy request errors
    proxyReq.on('error', (error) => {
      log.error('SSE proxy request error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'SSE proxy failed', message: error.message });
      } else {
        res.end();
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      log.debug('SSE client disconnected');
      proxyReq.destroy();
    });

    // End the request to start receiving the response
    proxyReq.end();
  } catch (error) {
    log.error('SSE proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE proxy failed', message: error.message });
    } else {
      res.end();
    }
  }
});

// API proxy endpoint - forward all other API requests to MCP server
app.use('/api', async (req, res) => {
  const targetUrl = `${MCP_SERVER_URL}/api${req.url}`;
  log.info(`Proxying API request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  
  try {
    // Create AbortController for timeout handling
    // Increase timeout for prompt testing and Ollama operations
    const timeoutMs = req.originalUrl.includes('/jobs/') && req.method === 'POST' ? 300000 :
                     req.originalUrl.includes('/prompts/test') ? 300000 :
                     req.originalUrl.includes('/ollama/') ? 300000 : 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      signal: controller.signal
    };
    
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);
    const data = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.set(key, value);
    });
    
    res.send(data);
    log.debug(`Proxy response: ${response.status} for ${req.originalUrl}`);
  } catch (error) {
    log.error(`Proxy error for ${req.originalUrl}:`, error.message);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
});

// Health proxy endpoint
app.get('/health/mcp', async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    log.error('MCP health check failed:', error.message);
    res.status(500).json({ error: 'MCP server unreachable' });
  }
});

// Health check - proxy to MCP server for React app compatibility
app.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.set(key, value);
    });
    
    res.send(data);
    log.debug(`Health endpoint proxied: ${response.status}`);
  } catch (error) {
    log.error('Health endpoint proxy error:', error.message);
    res.status(500).json({ 
      status: 'error',
      server: 'ui',
      error: 'MCP server unreachable',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve index.html for UI routes (SPA)
app.get('/ui', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  log.debug(`Serving index.html for UI route: ${req.path}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      log.error('Failed to serve index.html:', err);
      res.status(404).json({ 
        error: 'UI not built',
        message: 'Run: npm install && npm run build'
      });
    }
  });
});

app.get('/ui/*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  log.debug(`Serving index.html for UI route: ${req.path}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      log.error('Failed to serve index.html:', err);
      res.status(404).json({ 
        error: 'UI not built',
        message: 'Run: npm install && npm run build'
      });
    }
  });
});

// Redirect root to /ui
app.get('/', (req, res) => {
  log.debug('Redirecting root to /ui');
  res.redirect('/ui');
});

// Handle any other routes
app.get('*', (req, res) => {
  log.debug(`404 for unknown route: ${req.path}`);
  res.status(404).json({ 
    error: 'Not found',
    path: req.path
  });
});

// Wait for MCP server to be ready before starting UI server
async function waitForMCPServer() {
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/health`);
      if (response.ok) {
        log.info(`✅ MCP server is ready at ${MCP_SERVER_URL}`);
        return true;
      }
    } catch (error) {
      // MCP server not ready yet
    }
    
    if (attempt === maxAttempts) {
      log.warn(`⚠️ MCP server not ready after ${maxAttempts} attempts, starting UI anyway`);
      return false;
    }
    
    log.debug(`⏳ Waiting for MCP server... (attempt ${attempt}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Start server
waitForMCPServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    log.info(`✅ UI Server running on http://localhost:${PORT}`);
    log.info(`✅ Proxying API requests to ${MCP_SERVER_URL}`);
    log.info(`✅ Access the UI at http://localhost:${PORT}`);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log.error('Unhandled Rejection:', error);
  process.exit(1);
});