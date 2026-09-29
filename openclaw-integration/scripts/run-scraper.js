#!/usr/bin/env node

/**
 * Run the OpenClaw scraping workflow once.
 */

const { loadRuntimeConfig, validateRuntimeConfig } = require('../config/runtime-config');
const IntegrationController = require('../integrations/integration-controller');

loadRuntimeConfig();

async function main() {
  const configStatus = validateRuntimeConfig('public-scrape');
  const controller = new IntegrationController();

  configStatus.warnings.forEach((warning) => {
    console.warn(`⚠️  ${warning}`);
  });

  console.log('🕷️  Running OpenClaw scrape workflow...');

  const [fdaGuidance, fdaWarnings, pharmaApprovals] = await Promise.allSettled([
    controller.runIntegration('fda', 'scrape-guidance'),
    controller.runIntegration('fda', 'scrape-warnings'),
    controller.runIntegration('pharma', 'scrape-approvals')
  ]);

  const summarize = (label, result) => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      let count = 0;

      if (Array.isArray(value)) {
        count = value.length;
      } else if (typeof value?.itemsScraped === 'number') {
        count = value.itemsScraped;
      }

      console.log(`✅ ${label}: completed (${count} items)`);
      return { label, status: 'completed', count };
    }

    console.error(`❌ ${label}: ${result.reason?.message || result.reason}`);
    return { label, status: 'failed', error: result.reason?.message || String(result.reason) };
  };

  const summary = [
    summarize('FDA guidance', fdaGuidance),
    summarize('FDA warnings', fdaWarnings),
    summarize('Pharma approvals', pharmaApprovals)
  ];

  const failures = summary.filter((item) => item.status === 'failed');

  console.log('\n📊 Scrape summary');
  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Fatal scrape workflow error:', error);
  process.exit(1);
});
