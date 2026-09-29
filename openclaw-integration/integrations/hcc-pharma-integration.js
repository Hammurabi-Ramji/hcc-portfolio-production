/**
 * HCC-Pharma Integration Module (FIXED)
 * Monitors regulatory updates and syncs with HCC-Pharma system
 * 
 * IMPROVEMENTS:
 * - Added exponential backoff retry logic
 * - Input validation for all data types
 * - Rate limiting to prevent API throttling
 * - Proper error recovery and logging
 * - File logging with Winston
 * - Structured compliance data handling
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class HCCPharmaIntegration {
  constructor(config = {}) {
    this.pharmaApiUrl = config.pharmaApiUrl || process.env.HCC_PHARMA_API_URL || 'http://localhost:3003/api';
    this.pharmaToken = config.pharmaToken || process.env.HCC_PHARMA_TOKEN || '';
    this.scrapingConfig = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      rateLimit: 2000, // ms between requests (slower for pharma APIs)
      ...config.scrapingConfig
    };

    // Setup logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'hcc-pharma' },
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/pharma-error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/pharma-combined.log')
        })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }

    this.lastRequestTime = 0;
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = this.scrapingConfig.retries) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.scrapingConfig.rateLimit) {
          await new Promise(resolve =>
            setTimeout(resolve, this.scrapingConfig.rateLimit - timeSinceLastRequest)
          );
        }
        this.lastRequestTime = Date.now();

        return await fn();
      } catch (error) {
        const delay = Math.pow(2, attempt) * this.scrapingConfig.retryDelay;
        
        if (attempt < maxRetries - 1) {
          this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
            error: error.message,
            attempt
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Validate regulatory data
   */
  validateData(data, requiredFields = []) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    return data.filter(item => {
      const missing = requiredFields.filter(field => !item[field]);
      if (missing.length > 0) {
        this.logger.warn(`Skipping item missing fields: ${missing.join(', ')}`, { item });
        return false;
      }
      return true;
    });
  }

  /**
   * Scrape FDA drug approvals with retry logic
   */
  async scrapeDrugApprovals() {
    this.logger.info('💊 Scraping FDA Drug Approvals...');
    
    const approvals = [];
    const url = 'https://www.fda.gov/drugs/news-events-human-drugs/cders-new-molecular-entity-nme-approvals';

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get(url, {
          timeout: this.scrapingConfig.timeout,
          headers: { 'User-Agent': 'HCC-Pharma-Scraper/1.0' }
        })
      );

      const $ = cheerio.load(response.data);

      $('table tr').each((index, element) => {
        if (index === 0) return; // Skip header

        const cells = $(element).find('td');
        
        if (cells.length >= 5) {
          approvals.push({
            drugName: $(cells[0]).text().trim(),
            activeIngredient: $(cells[1]).text().trim(),
            indication: $(cells[2]).text().trim(),
            applicant: $(cells[3]).text().trim(),
            approvalDate: $(cells[4]).text().trim(),
            approvalType: $(cells[5]).text().trim() || 'Standard',
            priority: 'Standard',
            status: 'Approved'
          });
        }
      });

      this.logger.info(`✓ Scraped ${approvals.length} drug approvals`);
    } catch (error) {
      this.logger.error('✗ Error scraping drug approvals:', {
        error: error.message
      });
    }

    return this.validateData(approvals, ['drugName', 'activeIngredient']);
  }

  /**
   * Scrape clinical trial information with retry logic
   */
  async scrapeClinicalTrials(indication = 'cancer') {
    if (!indication || typeof indication !== 'string') {
      this.logger.warn('Invalid indication provided, using default', { indication });
      indication = 'cancer';
    }

    this.logger.info(`🔬 Scraping Clinical Trials for ${indication}...`);
    
    const trials = [];
    const url = `https://clinicaltrials.gov/api/query/full_studies?expr=${encodeURIComponent(indication)}&fmt=json&pageSize=10`;

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get(url, {
          timeout: this.scrapingConfig.timeout
        })
      );

      if (response.data.FullStudiesResponse && response.data.FullStudiesResponse.NStudiesReturned > 0) {
        response.data.FullStudiesResponse.Studies.forEach((study) => {
          const protocolSection = study.ProtocolSection;
          
          if (protocolSection?.IdentificationModule?.NCTId) {
            trials.push({
              nctId: protocolSection.IdentificationModule.NCTId,
              title: protocolSection.IdentificationModule.OfficialTitle || 'N/A',
              status: protocolSection.StatusModule?.OverallStatus || 'Unknown',
              phase: protocolSection.DesignModule?.PhaseList?.Phase?.[0] || 'N/A',
              enrollment: protocolSection.DesignModule?.EnrollmentInfo?.EnrollmentActual || 0,
              sponsor: protocolSection.SponsorCollaboratorsModule?.LeadSponsor?.LeadSponsorName || 'Unknown',
              startDate: protocolSection.StatusModule?.StartDateStruct?.Date || 'N/A',
              completionDate: protocolSection.StatusModule?.PrimaryCompletionDateStruct?.Date || 'N/A',
              condition: protocolSection.ConditionsModule?.ConditionList?.Condition?.[0] || indication
            });
          }
        });

        this.logger.info(`✓ Scraped ${trials.length} clinical trials`);
      }
    } catch (error) {
      this.logger.error('✗ Error scraping clinical trials:', {
        error: error.message,
        indication
      });
    }

    return this.validateData(trials, ['nctId', 'title']);
  }

  /**
   * Scrape regulatory announcements with retry logic
   */
  async scrapeRegulatoryAnnouncements() {
    this.logger.info('📢 Scraping Regulatory Announcements...');
    
    const announcements = [];
    const url = 'https://www.fda.gov/news-events/fda-newsroom';

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get(url, {
          timeout: this.scrapingConfig.timeout
        })
      );

      const $ = cheerio.load(response.data);

      $('article').each((index, element) => {
        const title = $(element).find('h3').text().trim();
        const date = $(element).find('.news-date').text().trim();
        const summary = $(element).find('.news-summary').text().trim();

        if (title) {
          announcements.push({
            title,
            date,
            summary,
            url: $(element).find('a').attr('href'),
            type: 'Regulatory Announcement',
            impact: 'High',
            applicableProducts: []
          });
        }
      });

      this.logger.info(`✓ Scraped ${announcements.length} announcements`);
    } catch (error) {
      this.logger.error('✗ Error scraping announcements:', {
        error: error.message
      });
    }

    return this.validateData(announcements, ['title']);
  }

  /**
   * Sync regulatory data to HCC-Pharma with retry logic
   */
  async syncRegulatoryData(data, dataType) {
    if (!Array.isArray(data) || data.length === 0) {
      this.logger.warn(`No ${dataType} to sync`);
      return { success: [], failed: [] };
    }

    this.logger.info(`📤 Syncing ${data.length} ${dataType} to HCC-Pharma...`);
    
    const results = {
      success: [],
      failed: []
    };

    for (const item of data) {
      try {
        const response = await this.retryWithBackoff(() =>
          axios.post(
            `${this.pharmaApiUrl}/regulatory/${dataType}/import`,
            {
              ...item,
              importSource: 'OpenClaw',
              importedAt: new Date().toISOString()
            },
            {
              timeout: this.scrapingConfig.timeout,
              headers: {
                'Authorization': `Bearer ${this.pharmaToken}`
              }
            }
          )
        );

        results.success.push({
          id: response.data.id,
          title: item.title || item.drugName || item.nctId
        });
        this.logger.info(`✓ Synced: ${item.title || item.drugName || item.nctId}`);
      } catch (error) {
        results.failed.push({
          item: item.title || item.drugName || item.nctId,
          error: error.message
        });
        this.logger.error(`✗ Failed to sync item`, {
          error: error.message,
          title: item.title || item.drugName
        });
      }
    }

    this.logger.info(`✓ Sync complete: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Create compliance notification with validation
   */
  async createComplianceNotification(data) {
    if (!data || !data.title || !data.type) {
      throw new Error('Notification must have title and type');
    }

    this.logger.info('🔔 Creating compliance notification...');
    
    try {
      const response = await this.retryWithBackoff(() =>
        axios.post(
          `${this.pharmaApiUrl}/compliance/notifications`,
          {
            type: data.type,
            severity: data.severity || 'Medium',
            title: data.title,
            description: data.description,
            affectedProducts: data.affectedProducts || [],
            actionRequired: data.actionRequired || false,
            dueDate: data.dueDate || null,
            createdAt: new Date().toISOString()
          },
          {
            timeout: this.scrapingConfig.timeout,
            headers: { 'Authorization': `Bearer ${this.pharmaToken}` }
          }
        )
      );

      this.logger.info(`✓ Notification created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('✗ Error creating notification:', {
        error: error.message,
        title: data.title
      });
      throw error;
    }
  }

  /**
   * Monitor regulatory compliance
   */
  async monitorCompliance() {
    this.logger.info('🔍 Starting regulatory compliance monitoring...');
    
    try {
      const approvals = await this.scrapeDrugApprovals();
      const announcements = await this.scrapeRegulatoryAnnouncements();

      const syncResults = {
        approvals: await this.syncRegulatoryData(approvals, 'approvals'),
        announcements: await this.syncRegulatoryData(announcements, 'announcements')
      };

      return {
        timestamp: new Date().toISOString(),
        itemsScraped: approvals.length + announcements.length,
        syncResults
      };
    } catch (error) {
      this.logger.error('✗ Compliance monitoring failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport() {
    this.logger.info('📋 Generating compliance report...');
    
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        sections: {
          drugApprovals: await this.scrapeDrugApprovals(),
          clinicalTrials: await this.scrapeClinicalTrials('cancer'),
          announcements: await this.scrapeRegulatoryAnnouncements()
        },
        summary: {
          totalApprovals: 0,
          activeTrials: 0,
          pendingAnnouncements: 0
        }
      };

      report.summary.totalApprovals = report.sections.drugApprovals.length;
      report.summary.activeTrials = report.sections.clinicalTrials.filter(t => t.status === 'Recruiting').length;
      report.summary.pendingAnnouncements = report.sections.announcements.length;

      // Save report
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const reportPath = path.join(dataDir, `compliance-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      this.logger.info(`✓ Report generated: ${reportPath}`);
      return report;
    } catch (error) {
      this.logger.error('✗ Error generating compliance report', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = HCCPharmaIntegration;