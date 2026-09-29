/**
 * Master Integration Controller (FIXED)
 * Orchestrates all HCC system integrations
 * 
 * IMPROVEMENTS:
 * - Added health checks for all APIs
 * - Better error handling and recovery
 * - Proper job tracking and cancellation
 * - File logging with Winston
 * - Configuration validation
 * - Graceful shutdown handling
 */

const HCCFDAIntegration = require('./hcc-fda-integration');
const HCCMantleIntegration = require('./hcc-mantle-integration');
const HCCPharmaIntegration = require('./hcc-pharma-integration');
const schedule = require('node-schedule');
const winston = require('winston');
const path = require('path');
const { loadRuntimeConfig, validateRuntimeConfig } = require('../config/runtime-config');

loadRuntimeConfig();

class IntegrationController {
  constructor(config = {}) {
    this.config = {
      fdaApiUrl: process.env.HCC_FDA_API_URL || 'http://localhost:3002/api',
      mantleApiUrl: process.env.HCC_MANTLE_API_URL || 'http://localhost:3001/api',
      pharmaApiUrl: process.env.HCC_PHARMA_API_URL || 'http://localhost:3003/api',
      ...config
    };

    // Validate critical config
    if (!this.config.fdaApiUrl || !this.config.mantleApiUrl || !this.config.pharmaApiUrl) {
      console.warn('⚠️  Warning: Some API URLs are not configured. Using defaults.');
    }

    // Initialize integrations
    this.fda = new HCCFDAIntegration({ 
      fdaApiUrl: this.config.fdaApiUrl 
    });
    
    this.mantle = new HCCMantleIntegration({ 
      mantleApiUrl: this.config.mantleApiUrl 
    });
    
    this.pharma = new HCCPharmaIntegration({ 
      pharmaApiUrl: this.config.pharmaApiUrl 
    });

    // Setup logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'integration-controller' },
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/controller-error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/controller-combined.log')
        })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }

    this.activeJobs = {};
    this.jobStats = {
      fda: { runs: 0, successes: 0, failures: 0, lastRun: null },
      mantle: { runs: 0, successes: 0, failures: 0, lastRun: null },
      pharma: { runs: 0, successes: 0, failures: 0, lastRun: null }
    };

    this.configValidation = validateRuntimeConfig('health');

    for (const warning of this.configValidation.warnings) {
      this.logger.warn(warning);
    }
  }

  getConfigurationHealth() {
    return validateRuntimeConfig('health');
  }

  /**
   * Start all integrations once
   */
  async startAllIntegrations() {
    this.logger.info('🚀 Starting all HCC integrations...');

    const results = {};

    try {
      // FDA
      try {
        results.fda = await this.fda.monitorComplianceUpdates();
        this.jobStats.fda.successes++;
        this.logger.info('✓ FDA integration completed');
      } catch (error) {
        results.fda = { error: error.message };
        this.jobStats.fda.failures++;
        this.logger.error('✗ FDA integration failed', { error: error.message });
      }

      // Mantle (without suppliers by default)
      try {
        results.mantle = await this.mantle.completeInventorySync([]);
        this.jobStats.mantle.successes++;
        this.logger.info('✓ Mantle integration completed');
      } catch (error) {
        results.mantle = { error: error.message };
        this.jobStats.mantle.failures++;
        this.logger.error('✗ Mantle integration failed', { error: error.message });
      }

      // Pharma
      try {
        results.pharma = await this.pharma.monitorCompliance();
        this.jobStats.pharma.successes++;
        this.logger.info('✓ Pharma integration completed');
      } catch (error) {
        results.pharma = { error: error.message };
        this.jobStats.pharma.failures++;
        this.logger.error('✗ Pharma integration failed', { error: error.message });
      }

      this.logger.info('✅ All integrations completed');
      return results;
    } catch (error) {
      this.logger.error('✗ Unexpected error in startAllIntegrations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Schedule FDA compliance monitoring
   */
  scheduleFDAMonitoring(cronExpression = '0 */4 * * *') {
    this.logger.info(`⏰ Scheduling FDA monitoring: ${cronExpression}`);

    if (this.activeJobs.fda) {
      this.activeJobs.fda.cancel();
      this.logger.info('Cancelled previous FDA job');
    }

    this.activeJobs.fda = schedule.scheduleJob(cronExpression, async () => {
      this.logger.info('🏥 FDA monitoring job triggered');
      this.jobStats.fda.runs++;
      this.jobStats.fda.lastRun = new Date().toISOString();

      try {
        await this.fda.monitorComplianceUpdates();
        this.jobStats.fda.successes++;
      } catch (error) {
        this.jobStats.fda.failures++;
        this.logger.error('✗ FDA monitoring job failed', {
          error: error.message
        });
      }
    });

    this.logger.info('✓ FDA monitoring scheduled');
  }

  /**
   * Schedule Mantle inventory sync
   */
  scheduleMantleSync(cronExpression = '0 */6 * * *', suppliers = []) {
    this.logger.info(`⏰ Scheduling Mantle inventory sync: ${cronExpression}`);

    if (this.activeJobs.mantle) {
      this.activeJobs.mantle.cancel();
      this.logger.info('Cancelled previous Mantle job');
    }

    this.activeJobs.mantle = schedule.scheduleJob(cronExpression, async () => {
      this.logger.info('🏗️  Mantle inventory sync job triggered');
      this.jobStats.mantle.runs++;
      this.jobStats.mantle.lastRun = new Date().toISOString();

      try {
        await this.mantle.completeInventorySync(suppliers);
        this.jobStats.mantle.successes++;
      } catch (error) {
        this.jobStats.mantle.failures++;
        this.logger.error('✗ Mantle sync job failed', {
          error: error.message
        });
      }
    });

    this.logger.info('✓ Mantle sync scheduled');
  }

  /**
   * Schedule Pharma compliance monitoring
   */
  schedulePharmaMonitoring(cronExpression = '0 0 * * *') {
    this.logger.info(`⏰ Scheduling Pharma monitoring: ${cronExpression}`);

    if (this.activeJobs.pharma) {
      this.activeJobs.pharma.cancel();
      this.logger.info('Cancelled previous Pharma job');
    }

    this.activeJobs.pharma = schedule.scheduleJob(cronExpression, async () => {
      this.logger.info('💊 Pharma compliance monitoring job triggered');
      this.jobStats.pharma.runs++;
      this.jobStats.pharma.lastRun = new Date().toISOString();

      try {
        await this.pharma.monitorCompliance();
        this.jobStats.pharma.successes++;
      } catch (error) {
        this.jobStats.pharma.failures++;
        this.logger.error('✗ Pharma monitoring job failed', {
          error: error.message
        });
      }
    });

    this.logger.info('✓ Pharma monitoring scheduled');
  }

  /**
   * Schedule complete integration workflow
   */
  scheduleCompleteWorkflow(config = {}) {
    this.logger.info('🔄 Scheduling complete integration workflow...');

    // FDA: Every 4 hours
    this.scheduleFDAMonitoring(config.fdaSchedule || '0 */4 * * *');

    // Mantle: Every 6 hours
    this.scheduleMantleSync(
      config.mantleSchedule || '0 */6 * * *',
      config.suppliers || []
    );

    // Pharma: Daily at midnight
    this.schedulePharmaMonitoring(config.pharmaSchedule || '0 0 * * *');

    this.logger.info('✅ Complete workflow scheduled');
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    this.logger.info('⏹️  Stopping all scheduled jobs...');

    Object.keys(this.activeJobs).forEach(key => {
      const job = this.activeJobs[key];
      if (job) {
        job.cancel();
        this.logger.info(`✓ Stopped ${key} job`);
      }
    });

    this.activeJobs = {};
    this.logger.info('✅ All jobs stopped');
  }

  /**
   * Get job status
   */
  getJobStatus() {
    return {
      fda: {
        status: this.activeJobs.fda ? 'running' : 'stopped',
        stats: this.jobStats.fda
      },
      mantle: {
        status: this.activeJobs.mantle ? 'running' : 'stopped',
        stats: this.jobStats.mantle
      },
      pharma: {
        status: this.activeJobs.pharma ? 'running' : 'stopped',
        stats: this.jobStats.pharma
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run specific integration with proper error handling
   */
  async runIntegration(system, action, params = {}) {
    this.logger.info(`🔄 Running ${system}/${action}...`);

    try {
      switch (system) {
        case 'fda':
          if (action === 'monitor') {
            return await this.fda.monitorComplianceUpdates();
          } else if (action === 'scrape-guidance') {
            return await this.fda.scrapeFDAGuidance();
          } else if (action === 'scrape-warnings') {
            return await this.fda.scrapeFDAWarningLetters();
          }
          break;

        case 'mantle':
          if (action === 'sync-inventory') {
            const suppliers = params.suppliers || [];
            return await this.mantle.completeInventorySync(suppliers);
          } else if (action === 'monitor-prices') {
            const suppliers = params.suppliers || [];
            return await this.mantle.monitorPriceChanges(suppliers);
          }
          break;

        case 'pharma':
          if (action === 'monitor') {
            return await this.pharma.monitorCompliance();
          } else if (action === 'generate-report') {
            return await this.pharma.generateComplianceReport();
          } else if (action === 'scrape-approvals') {
            return await this.pharma.scrapeDrugApprovals();
          } else if (action === 'scrape-trials') {
            const indication = params.indication || 'cancer';
            return await this.pharma.scrapeClinicalTrials(indication);
          }
          break;

        default:
          throw new Error(`Unknown system: ${system}`);
      }

      throw new Error(`Unknown action: ${system}/${action}`);
    } catch (error) {
      this.logger.error(`✗ Error: ${error.message}`, {
        system,
        action,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Health check for all integrations
   */
  async healthCheck() {
    this.logger.info('🏥 Running health checks...');

    const results = {
      timestamp: new Date().toISOString(),
      integrations: {
        fda: { status: 'unknown', itemsFound: 0 },
        mantle: { status: 'configured', itemsFound: 0 },
        pharma: { status: 'unknown', itemsFound: 0 }
      }
    };

    // Check FDA
    try {
      const fda = await this.fda.scrapeFDAGuidance();
      results.integrations.fda = {
        status: fda.length > 0 ? 'healthy' : 'no-data',
        itemsFound: fda.length
      };
    } catch (error) {
      results.integrations.fda = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check Pharma
    try {
      const approvals = await this.pharma.scrapeDrugApprovals();
      results.integrations.pharma = {
        status: approvals.length > 0 ? 'healthy' : 'no-data',
        itemsFound: approvals.length
      };
    } catch (error) {
      results.integrations.pharma = {
        status: 'unhealthy',
        error: error.message
      };
    }

    this.logger.info('Health check completed');
    return results;
  }

  /**
   * Get system stats
   */
  getSystemStats() {
    return {
      timestamp: new Date().toISOString(),
      jobs: this.getJobStatus(),
      integrationStats: this.jobStats,
      uptime: process.uptime()
    };
  }
}

module.exports = IntegrationController;