/**
 * HCC-Mantle Integration Module (FIXED)
 * Scrapes supplier data and syncs with HCC-Mantle ERP system
 * 
 * IMPROVEMENTS:
 * - Added exponential backoff retry logic
 * - Input validation for suppliers and products
 * - Rate limiting for supplier requests
 * - Proper error recovery
 * - File logging with Winston
 * - Price change tracking with history
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class HCCMantleIntegration {
  constructor(config = {}) {
    this.mantleApiUrl = config.mantleApiUrl || process.env.HCC_MANTLE_API_URL || 'http://localhost:3001/api';
    this.mantleToken = config.mantleToken || process.env.HCC_MANTLE_TOKEN || '';
    this.scrapingConfig = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      rateLimit: 1500, // ms between requests (longer for supplier APIs)
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
      defaultMeta: { service: 'hcc-mantle' },
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/mantle-error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/mantle-combined.log')
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
   * Validate supplier configuration
   */
  validateSuppliers(suppliers) {
    if (!Array.isArray(suppliers)) {
      throw new Error('Suppliers must be an array');
    }

    return suppliers.filter(supplier => {
      const errors = [];
      if (!supplier.id) errors.push('Missing id');
      if (!supplier.name) errors.push('Missing name');
      if (!supplier.url) errors.push('Missing url');
      if (!supplier.selectors) errors.push('Missing selectors');

      if (errors.length > 0) {
        this.logger.warn(`Invalid supplier configuration: ${errors.join(', ')}`, { supplier });
        return false;
      }
      return true;
    });
  }

  /**
   * Validate products
   */
  validateProducts(products) {
    if (!Array.isArray(products)) {
      throw new Error('Products must be an array');
    }

    return products.filter(product => {
      if (!product.sku || !product.productName || typeof product.price !== 'number') {
        this.logger.warn('Skipping invalid product', { product });
        return false;
      }
      return true;
    });
  }

  /**
   * Scrape supplier pricing with retry logic
   */
  async scrapeSupplierPricing(supplierUrls) {
    this.logger.info('💰 Scraping Supplier Pricing...');
    
    // Validate input
    const validSuppliers = this.validateSuppliers(supplierUrls);
    if (validSuppliers.length === 0) {
      this.logger.warn('No valid suppliers to scrape');
      return [];
    }

    const pricing = [];

    for (const supplier of validSuppliers) {
      try {
        const response = await this.retryWithBackoff(() =>
          axios.get(supplier.url, {
            timeout: this.scrapingConfig.timeout,
            headers: { 'User-Agent': 'HCC-Mantle-Scraper/1.0' }
          })
        );

        const $ = cheerio.load(response.data);
        const supplierPricing = [];
        
        $(supplier.selectors.container).each((index, element) => {
          const priceText = $(element).find(supplier.selectors.price).text().replace(/[^0-9.]/g, '');
          const price = parseFloat(priceText);

          if (!isNaN(price)) {
            supplierPricing.push({
              supplierId: supplier.id,
              supplierName: supplier.name,
              sku: $(element).find(supplier.selectors.sku).text().trim(),
              productName: $(element).find(supplier.selectors.product).text().trim(),
              price,
              unit: supplier.selectors.unit ? $(element).find(supplier.selectors.unit).text().trim() : 'each',
              availability: $(element).find(supplier.selectors.availability).text().trim() || 'In Stock',
              lastUpdated: new Date().toISOString()
            });
          }
        });

        pricing.push(...supplierPricing);
        this.logger.info(`✓ Scraped ${supplier.name}: ${supplierPricing.length} items`);
      } catch (error) {
        this.logger.error(`✗ Error scraping ${supplier.name}:`, {
          error: error.message,
          supplier: supplier.name
        });
      }
    }

    return this.validateProducts(pricing);
  }

  /**
   * Scrape flooring material specifications
   */
  async scrapeFlooringSpecs(materialUrls) {
    this.logger.info('🏗️  Scraping Flooring Specifications...');
    
    if (!Array.isArray(materialUrls) || materialUrls.length === 0) {
      this.logger.warn('No material URLs provided');
      return [];
    }

    const materials = [];

    for (const material of materialUrls) {
      try {
        const response = await this.retryWithBackoff(() =>
          axios.get(material.url, {
            timeout: this.scrapingConfig.timeout
          })
        );

        const $ = cheerio.load(response.data);
        const materialSpecs = [];

        $(material.selectors.container).each((index, element) => {
          const priceText = $(element).find(material.selectors.price).text().replace(/[^0-9.]/g, '');
          const price = parseFloat(priceText);

          if (!isNaN(price)) {
            materialSpecs.push({
              materialId: `mat-${Date.now()}-${index}`,
              name: $(element).find(material.selectors.name).text().trim(),
              type: material.type,
              thickness: $(element).find(material.selectors.thickness).text().trim(),
              width: $(element).find(material.selectors.width).text().trim(),
              length: $(element).find(material.selectors.length).text().trim(),
              pricePerUnit: price,
              color: $(element).find(material.selectors.color).text().trim(),
              finish: $(element).find(material.selectors.finish).text().trim(),
              durability: $(element).find(material.selectors.durability).text().trim(),
              warranty: $(element).find(material.selectors.warranty).text().trim(),
              inStock: $(element).find(material.selectors.stock).text().includes('In Stock'),
              leadTime: $(element).find(material.selectors.leadTime).text().trim()
            });
          }
        });

        materials.push(...materialSpecs);
        this.logger.info(`✓ Scraped ${material.type}: ${materialSpecs.length} materials`);
      } catch (error) {
        this.logger.error(`✗ Error scraping ${material.type}:`, {
          error: error.message,
          type: material.type
        });
      }
    }

    return materials;
  }

  /**
   * Update inventory in HCC-Mantle with retry logic
   */
  async updateInventory(products) {
    const validProducts = this.validateProducts(products);
    
    if (validProducts.length === 0) {
      this.logger.warn('No valid products to update');
      return { updated: [], created: [], failed: [] };
    }

    this.logger.info(`📥 Updating HCC-Mantle inventory with ${validProducts.length} items...`);
    
    const results = {
      updated: [],
      created: [],
      failed: []
    };

    for (const product of validProducts) {
      try {
        // Check if product exists
        const checkResponse = await this.retryWithBackoff(() =>
          axios.get(
            `${this.mantleApiUrl}/inventory?sku=${encodeURIComponent(product.sku)}`,
            {
              timeout: this.scrapingConfig.timeout,
              headers: { 'Authorization': `Bearer ${this.mantleToken}` }
            }
          )
        );

        if (checkResponse.data && checkResponse.data.length > 0) {
          // Update existing
          await this.retryWithBackoff(() =>
            axios.patch(
              `${this.mantleApiUrl}/inventory/${checkResponse.data[0].id}`,
              {
                quantity: product.availability === 'In Stock' ? 100 : 0,
                unitPrice: product.price,
                lastUpdated: new Date()
              },
              {
                timeout: this.scrapingConfig.timeout,
                headers: { 'Authorization': `Bearer ${this.mantleToken}` }
              }
            )
          );
          results.updated.push(product.sku);
          this.logger.info(`✓ Updated: ${product.sku}`);
        } else {
          // Create new
          await this.retryWithBackoff(() =>
            axios.post(
              `${this.mantleApiUrl}/inventory`,
              {
                name: product.productName,
                sku: product.sku,
                category: product.supplierName,
                quantity: product.availability === 'In Stock' ? 100 : 0,
                unitPrice: product.price,
                reorderLevel: 10
              },
              {
                timeout: this.scrapingConfig.timeout,
                headers: { 'Authorization': `Bearer ${this.mantleToken}` }
              }
            )
          );
          results.created.push(product.sku);
          this.logger.info(`✓ Created: ${product.sku}`);
        }
      } catch (error) {
        results.failed.push({ sku: product.sku, error: error.message });
        this.logger.error(`✗ Failed to update ${product.sku}`, {
          error: error.message,
          sku: product.sku
        });
      }
    }

    this.logger.info(`✓ Update complete: ${results.updated.length} updated, ${results.created.length} created, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Sync project materials to HCC-Mantle
   */
  async syncProjectMaterials(materials) {
    if (!Array.isArray(materials) || materials.length === 0) {
      this.logger.warn('No materials to sync');
      return { success: [], failed: [] };
    }

    this.logger.info(`📤 Syncing ${materials.length} materials to HCC-Mantle...`);
    
    const results = {
      success: [],
      failed: []
    };

    for (const material of materials) {
      try {
        const response = await this.retryWithBackoff(() =>
          axios.post(
            `${this.mantleApiUrl}/materials/sync`,
            material,
            {
              timeout: this.scrapingConfig.timeout,
              headers: { 'Authorization': `Bearer ${this.mantleToken}` }
            }
          )
        );

        results.success.push({
          materialId: material.materialId,
          name: material.name,
          mantleId: response.data.id
        });
        this.logger.info(`✓ Synced: ${material.name}`);
      } catch (error) {
        results.failed.push({
          materialId: material.materialId,
          error: error.message
        });
        this.logger.error(`✗ Failed to sync: ${material.name}`, {
          error: error.message,
          name: material.name
        });
      }
    }

    return results;
  }

  /**
   * Monitor supplier price changes with history tracking
   */
  async monitorPriceChanges(suppliers) {
    const validSuppliers = this.validateSuppliers(suppliers);
    
    if (validSuppliers.length === 0) {
      this.logger.warn('No valid suppliers for price monitoring');
      return [];
    }

    this.logger.info('📊 Starting supplier price monitoring...');
    
    const currentPrices = await this.scrapeSupplierPricing(validSuppliers);
    const pricesFile = path.join(__dirname, '../data/previous-prices.json');
    
    try {
      const previousPrices = JSON.parse(fs.readFileSync(pricesFile, 'utf8'));

      const priceChanges = [];
      
      for (const current of currentPrices) {
        const previous = previousPrices.find(p => p.sku === current.sku);
        
        if (previous && Math.abs(previous.price - current.price) > 0.01) {
          const change = ((current.price - previous.price) / previous.price * 100).toFixed(2);
          priceChanges.push({
            sku: current.sku,
            product: current.productName,
            oldPrice: previous.price,
            newPrice: current.price,
            change: `${change}%`,
            supplier: current.supplierName,
            changedAt: new Date().toISOString()
          });
        }
      }

      // Save current prices
      fs.writeFileSync(pricesFile, JSON.stringify(currentPrices, null, 2));

      if (priceChanges.length > 0) {
        this.logger.info(`⚠️  Found ${priceChanges.length} price changes`);
        priceChanges.forEach(change => {
          this.logger.info(`  ${change.sku}: $${change.oldPrice} → $${change.newPrice} (${change.change})`);
        });
      } else {
        this.logger.info('✓ No price changes detected');
      }

      return priceChanges;
    } catch (error) {
      // First run - create baseline
      if (!fs.existsSync(path.dirname(pricesFile))) {
        fs.mkdirSync(path.dirname(pricesFile), { recursive: true });
      }
      fs.writeFileSync(pricesFile, JSON.stringify(currentPrices, null, 2));
      this.logger.info('✓ Baseline prices saved for future comparison');
      return [];
    }
  }

  /**
   * Complete inventory sync workflow
   */
  async completeInventorySync(suppliers) {
    this.logger.info('🔄 Starting complete inventory sync...');
    
    const validSuppliers = this.validateSuppliers(suppliers);
    
    if (validSuppliers.length === 0) {
      this.logger.warn('No valid suppliers provided for inventory sync');
      return {
        timestamp: new Date().toISOString(),
        itemsScraped: 0,
        updateResults: { updated: [], created: [], failed: [] }
      };
    }

    const pricing = await this.scrapeSupplierPricing(validSuppliers);
    const updateResults = await this.updateInventory(pricing);

    return {
      timestamp: new Date().toISOString(),
      itemsScraped: pricing.length,
      updateResults
    };
  }
}

module.exports = HCCMantleIntegration;