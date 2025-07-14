/**
 * Job Scheduler
 * Background job scheduling and management
 */

import { Events } from '../events/EventEmitter.js';

export class JobScheduler {
  constructor(services) {
    this.services = services;
    this.logger = services.logger;
    this.eventEmitter = services.eventEmitter;
    this.jobs = new Map();
    this.intervals = new Map();
    this.running = false;
  }

  /**
   * Register a job
   */
  registerJob(jobId, job) {
    if (this.jobs.has(jobId)) {
      throw new Error(`Job ${jobId} already registered`);
    }

    this.jobs.set(jobId, {
      id: jobId,
      name: job.name,
      description: job.description,
      interval: job.interval,
      enabled: job.enabled !== false,
      handler: job.handler,
      lastRun: null,
      nextRun: null,
      running: false,
      stats: {
        runs: 0,
        failures: 0,
        totalDuration: 0,
        lastDuration: 0
      }
    });

    this.logger.info(`[JobScheduler] Registered job: ${jobId}`);
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.running) {
      this.logger.warn('[JobScheduler] Already running');
      return;
    }

    this.running = true;
    
    // Schedule all enabled jobs
    for (const [jobId, job] of this.jobs) {
      if (job.enabled) {
        this.scheduleJob(jobId);
      }
    }

    this.logger.info('[JobScheduler] Started');
    this.eventEmitter.emit(Events.SYSTEM_READY, { component: 'JobScheduler' });
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    
    // Clear all intervals
    for (const [jobId, intervalId] of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();

    this.logger.info('[JobScheduler] Stopped');
    this.eventEmitter.emit(Events.SYSTEM_SHUTDOWN, { component: 'JobScheduler' });
  }

  /**
   * Schedule a specific job
   */
  scheduleJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Clear existing interval if any
    if (this.intervals.has(jobId)) {
      clearInterval(this.intervals.get(jobId));
    }

    // Calculate next run time
    job.nextRun = new Date(Date.now() + job.interval);

    // Set up interval
    const intervalId = setInterval(() => {
      this.runJob(jobId);
    }, job.interval);

    this.intervals.set(jobId, intervalId);
    
    this.logger.info(`[JobScheduler] Scheduled job ${jobId} with interval ${job.interval}ms`);
  }

  /**
   * Run a specific job
   */
  async runJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.error(`[JobScheduler] Job ${jobId} not found`);
      return;
    }

    if (job.running) {
      this.logger.warn(`[JobScheduler] Job ${jobId} is already running`);
      return;
    }

    if (!job.enabled) {
      this.logger.debug(`[JobScheduler] Job ${jobId} is disabled`);
      return;
    }

    job.running = true;
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.interval);

    const startTime = Date.now();
    
    this.logger.info(`[JobScheduler] Running job: ${jobId}`);
    this.eventEmitter.emit(Events.JOB_STARTED, { jobId, name: job.name });

    try {
      await job.handler(this.services);
      
      const duration = Date.now() - startTime;
      job.stats.runs++;
      job.stats.lastDuration = duration;
      job.stats.totalDuration += duration;

      this.logger.info(`[JobScheduler] Job ${jobId} completed in ${duration}ms`);
      this.eventEmitter.emit(Events.JOB_COMPLETED, { 
        jobId, 
        name: job.name,
        duration 
      });
    } catch (error) {
      job.stats.failures++;
      
      this.logger.error(`[JobScheduler] Job ${jobId} failed:`, error);
      this.eventEmitter.emit(Events.JOB_FAILED, { 
        jobId, 
        name: job.name,
        error: error.message 
      });
    } finally {
      job.running = false;
    }
  }

  /**
   * Enable/disable a job
   */
  async toggleJob(jobId, enabled) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.enabled = enabled;

    if (enabled && this.running) {
      this.scheduleJob(jobId);
    } else if (!enabled && this.intervals.has(jobId)) {
      clearInterval(this.intervals.get(jobId));
      this.intervals.delete(jobId);
    }

    this.logger.info(`[JobScheduler] Job ${jobId} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      description: job.description,
      enabled: job.enabled,
      running: job.running,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      interval: job.interval,
      stats: { ...job.stats }
    };
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus() {
    const status = [];
    
    for (const jobId of this.jobs.keys()) {
      status.push(this.getJobStatus(jobId));
    }

    return status;
  }

  /**
   * Trigger a job manually
   */
  async triggerJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    this.logger.info(`[JobScheduler] Manually triggering job: ${jobId}`);
    await this.runJob(jobId);
  }

  /**
   * Trigger all jobs
   */
  async triggerAllJobs(exclude = []) {
    const jobsToRun = Array.from(this.jobs.keys())
      .filter(jobId => !exclude.includes(jobId));

    const results = [];
    
    for (const jobId of jobsToRun) {
      try {
        await this.triggerJob(jobId);
        results.push({ jobId, success: true });
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }

    return results;
  }
}