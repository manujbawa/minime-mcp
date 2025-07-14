/**
 * Health Controller
 * Handles system health checks and status
 */

import { BaseController } from './BaseController.js';
import os from 'os';

export class HealthController extends BaseController {
  constructor(services) {
    super(services);
  }

  /**
   * Basic health check
   */
  getHealth = async (req, res) => {
    try {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      this.handleError(res, error, 'Health check failed');
    }
  }

  /**
   * Detailed health check with system info
   */
  getDetailedHealth = async (req, res) => {
    try {
      // Check database connection
      let dbStatus = 'healthy';
      try {
        await this.databaseService.query('SELECT 1');
      } catch (error) {
        dbStatus = 'unhealthy';
        this.logger.error('Database health check failed:', error);
      }

      // Check service status
      const serviceStatus = {};
      for (const [name, service] of Object.entries(this.services)) {
        if (service && typeof service.isHealthy === 'function') {
          try {
            serviceStatus[name] = await service.isHealthy() ? 'healthy' : 'unhealthy';
          } catch (error) {
            serviceStatus[name] = 'unknown';
          }
        }
      }

      // System info
      const systemInfo = {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: process.memoryUsage()
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model,
          loadAverage: os.loadavg()
        }
      };

      res.json({
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        services: serviceStatus,
        system: systemInfo
      });
    } catch (error) {
      this.handleError(res, error, 'Detailed health check failed');
    }
  }
}