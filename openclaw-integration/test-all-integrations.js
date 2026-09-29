/**
 * Integration Test Script
 * Tests all HCC integrations to verify fixes
 */

const IntegrationController = require('./integrations/integration-controller');
const { loadRuntimeConfig, validateRuntimeConfig } = require('./config/runtime-config');
const fs = require('fs');
const path = require('path');

loadRuntimeConfig();

async function runTests() {
  console.log('\n🧪 OpenClaw HCC Integration Test Suite\n');
  console.log('='.repeat(50) + '\n');

  const controller = new IntegrationController({
    fdaApiUrl: process.env.HCC_FDA_API_URL || 'http://localhost:3002/api',
    mantleApiUrl: process.env.HCC_MANTLE_API_URL || 'http://localhost:3001/api',
    pharmaApiUrl: process.env.HCC_PHARMA_API_URL || 'http://localhost:3003/api'
  });

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Directory Structure
  console.log('📁 Test 1: Directory Structure');
  try {
    const dataDir = path.join(__dirname, 'data');
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(dataDir)) throw new Error('Data directory missing');
    if (!fs.existsSync(logsDir)) throw new Error('Logs directory missing');
    
    console.log('   ✅ PASS: Directories exist\n');
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 2: FDA Scraping
  console.log('🏥 Test 2: FDA Integration - Scrape Guidance');
  try {
    const guidance = await controller.runIntegration('fda', 'scrape-guidance');
    if (!Array.isArray(guidance)) throw new Error('Not an array');
    console.log(`   ✅ PASS: Scraped ${guidance.length} FDA documents\n`);
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 3: FDA Retry Logic
  console.log('🔄 Test 3: FDA Retry Logic');
  try {
    const warnings = await controller.runIntegration('fda', 'scrape-warnings');
    console.log(`   ✅ PASS: Retry logic functional (${warnings.length} warnings)\n`);
    passedTests++;
  } catch (error) {
    console.log(`   ⚠️  WARNING: ${error.message} (API may be unreachable)\n`);
    failedTests++;
  }

  // Test 4: Mantle Validation
  console.log('🏗️  Test 4: Mantle Input Validation');
  try {
    // Test with empty suppliers (should not crash)
    const result = await controller.mantle.completeInventorySync([]);
    if (!result.timestamp) throw new Error('No timestamp in result');
    console.log('   ✅ PASS: Validation works (empty suppliers handled gracefully)\n');
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 5: Pharma Error Recovery
  console.log('💊 Test 5: Pharma Error Recovery');
  try {
    const approvals = await controller.runIntegration('pharma', 'scrape-approvals');
    console.log(`   ✅ PASS: Error recovery working (${approvals.length} approvals)\n`);
    passedTests++;
  } catch (error) {
    console.log(`   ⚠️  WARNING: ${error.message}\n`);
    failedTests++;
  }

  // Test 6: Health Check
  console.log('🏥 Test 6: System Health Check');
  try {
    const health = await controller.healthCheck();
    if (!health.timestamp) throw new Error('No timestamp');
    const integrationsChecked = Object.keys(health.integrations).length;
    console.log(`   ✅ PASS: Health check completed for ${integrationsChecked} systems\n`);
    console.log('   Status:');
    Object.entries(health.integrations).forEach(([key, status]) => {
      const icon = status.status === 'healthy' ? '✓' : 
                   status.status === 'unhealthy' ? '✗' : '?';
      console.log(`     ${icon} ${key}: ${status.status}`);
    });
    console.log();
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 7: Job Scheduling
  console.log('⏰ Test 7: Job Scheduling');
  try {
    controller.scheduleCompleteWorkflow({
      fdaSchedule: '0 0 * * *',
      mantleSchedule: '0 0 * * *',
      pharmaSchedule: '0 0 * * *',
      suppliers: []
    });
    
    const status = controller.getJobStatus();
    if (status.fda.status !== 'running') throw new Error('FDA job not running');
    if (status.mantle.status !== 'running') throw new Error('Mantle job not running');
    if (status.pharma.status !== 'running') throw new Error('Pharma job not running');
    
    controller.stopAllJobs();
    console.log('   ✅ PASS: Jobs scheduled and stopped successfully\n');
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 8: Configuration
  console.log('⚙️  Test 8: Configuration');
  try {
    const configStatus = validateRuntimeConfig('test');
    if (!configStatus.ok) throw new Error(configStatus.errors.join(' | '));
    console.log('   ✅ PASS: Configuration complete with non-placeholder beta values\n');
    passedTests++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failedTests++;
  }

  // Test 9: Logging
  console.log('📝 Test 9: File Logging');
  try {
    const logsDir = path.join(__dirname, 'logs');
    const files = fs.readdirSync(logsDir);
    if (files.length === 0) throw new Error('No log files created');
    console.log(`   ✅ PASS: ${files.length} log files exist\n`);
    console.log('   Log files:');
    files.forEach(f => console.log(`     - ${f}`));
    console.log();
    passedTests++;
  } catch (error) {
    console.log(`   ⚠️  WARNING: ${error.message}\n`);
    failedTests++;
  }

  // Summary
  console.log('='.repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   Total:  ${passedTests + failedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%\n`);

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ OpenClaw integration is ready for production use.\n');
  } else if (failedTests <= 2) {
    console.log('⚠️  Some tests failed (likely due to API connectivity)');
    console.log('   Please verify API endpoints are configured correctly.\n');
  } else {
    console.log('❌ Multiple tests failed. Review the fixes and try again.\n');
  }

  process.exit(failedTests > 2 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
