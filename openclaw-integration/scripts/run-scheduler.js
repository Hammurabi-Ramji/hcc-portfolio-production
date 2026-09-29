#!/usr/bin/env node

/**
 * Start the OpenClaw scheduled workflow from the package.json script.
 */

const { loadRuntimeConfig, assertRuntimeConfig } = require('../config/runtime-config');
const IntegrationController = require('../integrations/integration-controller');

loadRuntimeConfig();

function main() {
  assertRuntimeConfig('schedule');
  const controller = new IntegrationController();

  console.log('⏰ Starting OpenClaw scheduled workflow...');
  console.log('   FDA: every 4 hours');
  console.log('   Mantle: every 6 hours');
  console.log('   Pharma: daily at midnight');
  console.log('   Press Ctrl+C to stop.\n');

  controller.scheduleCompleteWorkflow({
    fdaSchedule: '0 */4 * * *',
    mantleSchedule: '0 */6 * * *',
    pharmaSchedule: '0 0 * * *',
    suppliers: []
  });

  const shutdown = () => {
    console.log('\n⏹️  Stopping scheduled workflow...');
    controller.stopAllJobs();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
