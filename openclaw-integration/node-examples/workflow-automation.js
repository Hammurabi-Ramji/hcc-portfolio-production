/**
 * Workflow Automation Example
 * Demonstrates scheduling and automated tasks
 */

const schedule = require('node-schedule');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Log to file
  fs.appendFileSync(
    path.join(__dirname, '../logs/workflow.log'),
    `[${timestamp}] ${message}\n`
  );
};

/**
 * Scrape data from target
 */
async function scrapeTarget(target) {
  try {
    log(`Scraping: ${target.name} from ${target.url}`);
    
    const response = await axios.get(target.url, {
      timeout: target.timeout || 30000
    });
    
    // Parse data (simplified)
    const data = {
      source: target.name,
      timestamp: new Date(),
      itemCount: 0,
      raw: response.data
    };
    
    log(`✓ Successfully scraped ${target.name}`);
    return data;
  } catch (error) {
    log(`✗ Failed to scrape ${target.name}: ${error.message}`);
    throw error;
  }
}

/**
 * Process scraped data
 */
async function processData(data) {
  try {
    log(`Processing data from ${data.source}`);
    
    // Data transformation and validation
    const processed = {
      ...data,
      processed: true,
      processedAt: new Date()
    };
    
    log(`✓ Data processing complete`);
    return processed;
  } catch (error) {
    log(`✗ Data processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Save results to database or file
 */
async function saveResults(data) {
  try {
    const filename = `${data.source}-${Date.now()}.json`;
    const filepath = path.join(__dirname, '../data', filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    log(`✓ Results saved to ${filename}`);
    return filepath;
  } catch (error) {
    log(`✗ Failed to save results: ${error.message}`);
    throw error;
  }
}

/**
 * Complete workflow job
 */
async function runWorkflow(targets) {
  log(`\n${'='.repeat(50)}`);
  log(`STARTING WORKFLOW - ${targets.length} targets`);
  log(`${'='.repeat(50)}\n`);
  
  const results = [];
  const errors = [];
  
  for (const target of targets) {
    try {
      const scrapedData = await scrapeTarget(target);
      const processedData = await processData(scrapedData);
      const savedPath = await saveResults(processedData);
      
      results.push({
        target: target.name,
        status: 'success',
        filepath: savedPath
      });
    } catch (error) {
      errors.push({
        target: target.name,
        error: error.message
      });
    }
  }
  
  // Summary
  log(`\n${'='.repeat(50)}`);
  log(`WORKFLOW COMPLETE`);
  log(`Successful: ${results.length}`);
  log(`Failed: ${errors.length}`);
  log(`${'='.repeat(50)}\n`);
  
  if (errors.length > 0) {
    log('Errors:');
    errors.forEach(e => log(`  - ${e.target}: ${e.error}`));
  }
  
  return { results, errors };
}

/**
 * Schedule workflows
 */
function scheduleWorkflows(config) {
  config.workflows.forEach(workflow => {
    log(`Scheduling: ${workflow.name} at ${workflow.schedule}`);
    
    schedule.scheduleJob(workflow.schedule, async () => {
      try {
        await runWorkflow(workflow.targets);
      } catch (error) {
        log(`Workflow error: ${error.message}`);
      }
    });
  });
  
  log('Workflows scheduled successfully');
}

/**
 * Example workflow configuration
 */
const exampleConfig = {
  workflows: [
    {
      name: 'Daily Product Scrape',
      schedule: '0 2 * * *',  // 2 AM daily
      targets: [
        {
          name: 'supplier-a',
          url: 'https://supplier-a.com/products',
          timeout: 30000
        },
        {
          name: 'supplier-b',
          url: 'https://supplier-b.com/pricing',
          timeout: 30000
        }
      ]
    },
    {
      name: 'Hourly Price Check',
      schedule: '0 * * * *',  // Every hour
      targets: [
        {
          name: 'competitor-pricing',
          url: 'https://competitor.com/prices',
          timeout: 20000
        }
      ]
    }
  ]
};

// Export functions
module.exports = {
  scrapeTarget,
  processData,
  saveResults,
  runWorkflow,
  scheduleWorkflows,
  exampleConfig
};

// Run if executed directly
if (require.main === module) {
  log('Starting OpenClaw Workflow Automation...');
  
  // Create logs directory if needed
  if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'), { recursive: true });
  }
  
  // Start scheduling
  scheduleWorkflows(exampleConfig);
  
  log('Workflow automation started. Press Ctrl+C to stop.');
}
