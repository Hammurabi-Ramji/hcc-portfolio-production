/**
 * HCC-FDA Integration Module (FIXED)
 * Scrapes compliance documents and syncs with HCC-FDA system
 * 
 * IMPROVEMENTS:
 * - Added exponential backoff retry logic
 * - Input validation for all parameters
 * - Proper error recovery and fallbacks
 * - File logging with Winston
 * - Rate limiting to prevent API throttling
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class HCCFDAIntegration {
  constructor(config = {}) {
    this.fdaApiUrl = config.fdaApiUrl || process.env.HCC_FDA_API_URL || 'http://localhost:3002/api';
    this.fdaToken = config.fdaToken || process.env.HCC_FDA_TOKEN || '';
    this.scrapingConfig = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      rateLimit: 1000, // ms between requests
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
      defaultMeta: { service: 'hcc-fda' },
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/fda-error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/fda-combined.log')
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
   * Validate and normalize documents
   */
  validateDocuments(documents) {
    if (!Array.isArray(documents)) {
      throw new Error('Documents must be an array');
    }

    return documents.filter(doc => {
      if (!doc.title || !doc.url) {
        this.logger.warn('Skipping invalid document', { doc });
        return false;
      }
      return true;
    });
  }

  /**
   * Scrape FDA guidance documents with retry logic
   */
  async scrapeFDAGuidance() {
    this.logger.info('🏥 Scraping FDA Guidance Documents...');
    
    const documents = [];
    const urls = [
      'https://www.fda.gov/drugs/guidance-compliance-regulatory-information/guidances-drugs',
      'https://www.fda.gov/medical-devices/guidance-documents'
    ];

    for (const url of urls) {
      try {
        const response = await this.retryWithBackoff(() =>
          axios.get(url, {
            timeout: this.scrapingConfig.timeout,
            headers: { 'User-Agent': 'HCC-FDA-Scraper/1.0' }
          })
        );

        const $ = cheerio.load(response.data);
        const pageDocuments = [];
        
        $('a[href*="guidance"]').each((index, element) => {
          pageDocuments.push({
            title: $(element).text().trim(),
            url: $(element).attr('href'),
            source: 'FDA Official',
            scrapedAt: new Date().toISOString(),
            type: url.includes('drugs') ? 'Drug' : 'Device'
          });
        });

        documents.push(...pageDocuments);
        this.logger.info(`✓ Scraped ${pageDocuments.length} documents from ${url}`);
      } catch (error) {
        this.logger.error(`✗ Error scraping ${url}:`, {
          error: error.message,
          url
        });
      }
    }

    return this.validateDocuments(documents);
  }

  /**
   * Scrape FDA warning letters with retry logic
   */
  async scrapeFDAWarningLetters() {
    this.logger.info('⚠️  Scraping FDA Warning Letters...');
    
    const warningLetters = [];
    const url = 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/enforcement-actions';

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get(url, {
          timeout: this.scrapingConfig.timeout
        })
      );

      const $ = cheerio.load(response.data);

      $('article').each((index, element) => {
        const title = $(element).find('h3').text().trim();
        const link = $(element).find('a').attr('href');
        const date = $(element).find('time').attr('datetime');

        if (title && link) {
          warningLetters.push({
            id: `warning-${Date.now()}-${index}`,
            title,
            url: link,
            date: date || new Date().toISOString(),
            severity: 'High',
            status: 'New'
          });
        }
      });

      this.logger.info(`✓ Scraped ${warningLetters.length} warning letters`);
    } catch (error) {
      this.logger.error('✗ Error scraping warning letters:', {
        error: error.message
      });
    }

    return this.validateDocuments(warningLetters);
  }

  /**
   * Scrape regulatory updates with retry logic
   */
  async scrapeRegulatoryUpdates() {
    this.logger.info('📋 Scraping Regulatory Updates...');
    
    const updates = [];
    const url = 'https://www.fda.gov/news-events/fda-newsroom';

    try {
      const response = await this.retryWithBackoff(() =>
        axios.get(url, {
          timeout: this.scrapingConfig.timeout
        })
      );

      const $ = cheerio.load(response.data);

      $('div.news-item').each((index, element) => {
        const headline = $(element).find('.news-title').text().trim();
        if (headline) {
          updates.push({
            id: `update-${Date.now()}-${index}`,
            headline,
            summary: $(element).find('.news-summary').text().trim(),
            date: $(element).find('.news-date').text().trim(),
            url: $(element).find('a').attr('href'),
            category: 'Regulatory Update'
          });
        }
      });

      this.logger.info(`✓ Scraped ${updates.length} regulatory updates`);
    } catch (error) {
      this.logger.error('✗ Error scraping updates:', {
        error: error.message
      });
    }

    return this.validateDocuments(updates);
  }

  /**
   * Sync compliance documents to HCC-FDA with retry logic
   */
  async syncToHCCFDA(documents, documentType = 'guidance') {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      this.logger.warn('No documents to sync');
      return { success: [], failed: [] };
    }

    this.logger.info(`📤 Syncing ${documents.length} documents to HCC-FDA...`);
    
    const results = {
      success: [],
      failed: []
    };

    for (const doc of documents) {
      try {
        const payload = {
          title: doc.title,
          url: doc.url,
          type: documentType,
          source: 'FDA Official',
          status: 'unreviewed',
          metadata: {
            scrapedAt: doc.scrapedAt,
            documentType: doc.type
          }
        };

        const response = await this.retryWithBackoff(() =>
          axios.post(`${this.fdaApiUrl}/documents/import`, payload, {
            timeout: this.scrapingConfig.timeout,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.fdaToken}`
            }
          })
        );

        if (response.status === 201 || response.status === 200) {
          results.success.push({
            title: doc.title,
            id: response.data.id
          });
          this.logger.info(`✓ Synced: ${doc.title}`);
        }
      } catch (error) {
        results.failed.push({
          title: doc.title,
          error: error.message
        });
        this.logger.error(`✗ Failed to sync: ${doc.title}`, {
          error: error.message
        });
      }
    }

    this.logger.info(`✓ Sync complete: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Monitor for new compliance documents
   */
  async monitorComplianceUpdates() {
    this.logger.info('🔍 Starting compliance monitoring...');
    
    try {
      const guidance = await this.scrapeFDAGuidance();
      const warnings = await this.scrapeFDAWarningLetters();
      const updates = await this.scrapeRegulatoryUpdates();

      const syncResults = {
        guidance: await this.syncToHCCFDA(guidance, 'guidance'),
        warnings: await this.syncToHCCFDA(warnings, 'warning'),
        updates: await this.syncToHCCFDA(updates, 'update')
      };

      return {
        timestamp: new Date().toISOString(),
        itemsScraped: guidance.length + warnings.length + updates.length,
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
   * Save scraped data to file
   */
  async saveToFile(data, filename) {
    try {
      const filepath = path.join(__dirname, '../data', filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      this.logger.info(`✓ Data saved to ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`✗ Error saving file: ${error.message}`);
      throw error;
    }
  }
}

module.exports = HCCFDAIntegration;