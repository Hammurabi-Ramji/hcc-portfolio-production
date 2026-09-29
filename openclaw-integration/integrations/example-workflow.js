/**
 * Example: Complete HCC Integration Workflow
 * Demonstrates how to use all integrations together
 */

const IntegrationController = require('./integration-controller');

async function main() {
  console.log('🎯 OpenClaw HCC Integration Workflow\n');
  console.log('=' .repeat(50) + '\n');

  // Initialize controller
  const controller = new IntegrationController({
    fdaApiUrl: process.env.HCC_FDA_API_URL || 'http://localhost:3002/api',
    mantleApiUrl: process.env.HCC_MANTLE_API_URL || 'http://localhost:3001/api',
    pharmaApiUrl: process.env.HCC_PHARMA_API_URL || 'http://localhost:3003/api'
  });

  // Example: Run health check
  console.log('📊 Step 1: Health Check\n');
  await controller.healthCheck();
  console.log('\n');

  // Example: Run individual integrations
  console.log('📊 Step 2: Running Individual Integrations\n');

  try {
    // FDA Integration
    console.log('🏥 FDA Integration:');
    const fdaGuidance = await controller.runIntegration('fda', 'scrape-guidance');
    console.log(`  Found ${fdaGuidance.length} guidance documents\n`);

    // Pharma Integration
    console.log('💊 Pharma Integration:');
    const pharmaApprovals = await controller.runIntegration('pharma', 'scrape-approvals');
    console.log(`  Found ${pharmaApprovals.length} drug approvals\n`);

    // Mantle Integration (without suppliers)
    console.log('🏗️  Mantle Integration:');
    console.log('  Inventory sync configured\n');

  } catch (error) {
    console.error('Error running integrations:', error.message);
  }

  // Example: Schedule integrations
  console.log('📊 Step 3: Scheduling Integrations\n');
  
  controller.scheduleCompleteWorkflow({
    // FDA: Every 4 hours
    fdaSchedule: '0 */4 * * *',
    
    // Mantle: Every 6 hours (with example suppliers)
    mantleSchedule: '0 */6 * * *',
    suppliers: [
      {
        id: 'sup-001',
        name: 'Flooring Direct',
        url: 'https://example-supplier.com/products',
        selectors: {
          container: '.product-item',
          sku: '.sku',
          product: '.product-name',
          price: '.price',
          availability: '.stock-status'
        }
      }
    ],
    
    // Pharma: Daily at midnight
    pharmaSchedule: '0 0 * * *'
  });

  // Example: Get job status
  console.log('\n📊 Step 4: Job Status\n');
  const status = controller.getJobStatus();
  console.log('Active Jobs:');
  Object.entries(status).forEach(([key, value]) => {
    if (key !== 'timestamp') {
      console.log(`  ${key}: ${value}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ Integration workflow started!\n');

  // Keep process running
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Shutting down...');
    controller.stopAllJobs();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = main;
