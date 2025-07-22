import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { asyncHandler } from '../server/middleware/error-handler.js';

const execAsync = promisify(exec);

// Helper to safely read log files
async function readLogFile(filePath, maxLines = 1000) {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size > 10 * 1024 * 1024) { // If file > 10MB, read only last part
            const { stdout } = await execAsync(`tail -n ${maxLines} "${filePath}"`);
            return stdout;
        } else {
            return await fs.readFile(filePath, 'utf8');
        }
    } catch (error) {
        return null; // File doesn't exist or can't be read
    }
}


export default function logsRoutes(app, services) {
    // Get startup logs
    app.get('/api/logs/startup', asyncHandler(async (req, res) => {
        try {
            const lines = parseInt(req.query.lines) || 500;
            
            // When running inside Docker, we can access the container logs via docker socket
            // or read from standard log locations
            let logs = '';
            
            try {
                // Read actual log files from the filesystem
                // Priority order: app logs, postgres logs, system logs
                
                // Option 1: Application logs
                const appLogs = await readLogFile('/app/logs/combined.log', lines);
                if (appLogs) {
                    logs = `=== Application Logs ===\n${appLogs}\n\n`;
                }
                
                // Option 2: PostgreSQL logs
                const pgLogs = await readLogFile('/data/postgres.log', Math.min(lines, 100));
                if (pgLogs) {
                    logs += `=== PostgreSQL Startup Logs ===\n${pgLogs}\n\n`;
                }
                
                // Option 3: System logs
                const dpkgLogs = await readLogFile('/var/log/dpkg.log', 50);
                if (dpkgLogs) {
                    logs += `=== System Package Logs ===\n${dpkgLogs.split('\n').slice(-20).join('\n')}\n`;
                }
                
                if (!logs) {
                    logs = 'No startup logs found in standard locations.\n';
                    logs += 'Checked: /app/logs/, /data/postgres.log, /var/log/\n';
                }
                
            } catch (e) {
                console.error('Error reading logs:', e);
                logs = `Error accessing log files: ${e.message}\n`;
            }
            
            res.json({
                timestamp: new Date().toISOString(),
                logs: logs,
                lines: logs.split('\n').length
            });
        } catch (error) {
            console.error('Error fetching startup logs:', error);
            res.status(500).json({ 
                error: 'Failed to fetch startup logs',
                message: error.message 
            });
        }
    }));

    // Get recent logs
    app.get('/api/logs/recent', asyncHandler(async (req, res) => {
        try {
            const lines = parseInt(req.query.lines) || 100;
            
            let logs = '';
            
            try {
                // Read recent logs from actual log files
                
                // Option 1: Application logs (most recent)
                const { stdout: appLogs } = await execAsync(`tail -n ${lines} /app/logs/combined.log 2>/dev/null || echo ""`);
                if (appLogs && appLogs.trim()) {
                    logs = `=== Recent Application Logs ===\n${appLogs}\n\n`;
                }
                
                // Option 2: Error logs
                const { stdout: errorLogs } = await execAsync(`tail -n ${Math.min(lines, 50)} /app/logs/error.log 2>/dev/null || echo ""`);
                if (errorLogs && errorLogs.trim()) {
                    logs += `=== Recent Error Logs ===\n${errorLogs}\n\n`;
                }
                
                // Option 3: PostgreSQL logs
                const { stdout: pgLogs } = await execAsync(`tail -n ${Math.min(lines, 50)} /data/postgres.log 2>/dev/null || echo ""`);
                if (pgLogs && pgLogs.trim()) {
                    logs += `=== Recent PostgreSQL Logs ===\n${pgLogs}\n\n`;
                }
                
                if (!logs) {
                    // If no logs found, show system info
                    const { stdout: uptime } = await execAsync('uptime');
                    logs = `System Status:\n${uptime}\n\n`;
                    logs += `Server uptime: ${Math.floor(process.uptime() / 60)} minutes\n`;
                    logs += `No log files found in: /app/logs/, /data/postgres.log\n`;
                }
                
            } catch (e) {
                console.error('Error reading recent logs:', e);
                logs = `Error accessing log files: ${e.message}\n`;
            }
            
            res.json({
                timestamp: new Date().toISOString(),
                logs: logs,
                lines: logs.split('\n').length
            });
        } catch (error) {
            console.error('Error fetching recent logs:', error);
            res.status(500).json({ 
                error: 'Failed to fetch recent logs',
                message: error.message 
            });
        }
    }));

    // Get live logs (streaming)
    app.get('/api/logs/live', async (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

        // Use tail -f to follow log files or use journalctl to follow system logs
        let tailProcess = null;
        
        try {
            // Tail the actual application log files
            const logFiles = [
                '/app/logs/combined.log',
                '/app/logs/error.log',
                '/data/postgres.log'
            ];
            
            let foundLogFile = false;
            for (const logFile of logFiles) {
                try {
                    await execAsync(`test -f ${logFile}`);
                    // Tail the log file, showing last 10 lines and following new entries
                    tailProcess = spawn('tail', ['-f', '-n', '10', logFile]);
                    foundLogFile = true;
                    
                    // Send initial message about which log we're tailing
                    res.write(`data: ${JSON.stringify({ 
                        type: 'log', 
                        content: `=== Following ${logFile} ===`,
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                    break;
                } catch (e) {
                    // File doesn't exist, try next
                }
            }
            
            if (!foundLogFile) {
                // If no log files exist yet, create a message
                res.write(`data: ${JSON.stringify({ 
                    type: 'log', 
                    content: 'Waiting for log files to be created...',
                    timestamp: new Date().toISOString()
                })}\n\n`);
                
                // Try to tail combined.log even if it doesn't exist yet (it will be created)
                tailProcess = spawn('tail', ['-F', '/app/logs/combined.log']);
            }
            
            if (tailProcess && tailProcess.stdout) {
                tailProcess.stdout.on('data', (data) => {
                    const lines = data.toString().split('\n').filter(line => line.trim());
                    lines.forEach(line => {
                        const logData = {
                            type: 'log',
                            content: line,
                            timestamp: new Date().toISOString()
                        };
                        try {
                            res.write(`data: ${JSON.stringify(logData)}\n\n`);
                        } catch (e) {
                            // Connection closed
                            if (tailProcess) tailProcess.kill();
                        }
                    });
                });
                
                tailProcess.stderr.on('data', (data) => {
                    console.error('Tail process error:', data.toString());
                });
            }
        } catch (e) {
            console.error('Error starting tail process:', e);
            // Send error message to client
            res.write(`data: ${JSON.stringify({
                type: 'log',
                content: 'Unable to start live log streaming. Logs may not be available in current configuration.',
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
        }, 30000);

        // Cleanup on client disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            if (tailProcess) {
                try {
                    tailProcess.kill();
                } catch (e) {
                    console.error('Error killing tail process:', e);
                }
            }
            res.end();
        });
    });
}