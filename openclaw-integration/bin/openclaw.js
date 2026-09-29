#!/usr/bin/env node

/**
 * OpenClaw HCC Integration - CLI Entry Point
 * Packaged executable wrapper
 */

const path = require('path');
const fs = require('fs');
const IntegrationController = require('../integrations/integration-controller');
const {
  loadRuntimeConfig,
  validateRuntimeConfig,
  assertRuntimeConfig
} = require('../config/runtime-config');

loadRuntimeConfig();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function title(message) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, message);
  console.log('='.repeat(60) + '\n');
}

async function showMenu() {
  title('OpenClaw HCC Integration System');
  
  console.log('Available Commands:\n');
  console.log('  1. health        - Check system health');
  console.log('  2. fda           - Run FDA monitoring');
  console.log('  3. mantle        - Run Mantle inventory sync');
  console.log('  4. pharma        - Run Pharma compliance monitoring');
  console.log('  5. test          - Run all tests');
  console.log('  6. schedule      - Start scheduled jobs');
  console.log('  7. status        - Show job status');
  console.log('  8. logs          - View recent logs');
  console.log('  9. help          - Show detailed help');
  console.log('  0. exit          - Exit application\n');
}

async function runCommand(command) {
  const controller = new IntegrationController();

  try {
    switch (command.toLowerCase()) {
      case 'health': {
        log(colors.blue, '🏥 Running health checks...\n');
        const health = await controller.healthCheck();
        health.configuration = controller.getConfigurationHealth();
        console.log(JSON.stringify(health, null, 2));
        break;
      }

      case 'fda': {
        assertRuntimeConfig('fda');
        log(colors.blue, '🏥 Running FDA monitoring...\n');
        const fdaResult = await controller.runIntegration('fda', 'monitor');
        log(colors.green, `✓ FDA: Scraped ${fdaResult.itemsScraped} items`);
        break;
      }

      case 'mantle': {
        assertRuntimeConfig('mantle');
        log(colors.blue, '🏗️  Running Mantle inventory sync...\n');
        await controller.runIntegration('mantle', 'sync-inventory', { suppliers: [] });
        log(colors.green, `✓ Mantle: Sync complete`);
        break;
      }

      case 'pharma': {
        assertRuntimeConfig('pharma');
        log(colors.blue, '💊 Running Pharma compliance monitoring...\n');
        const pharmaResult = await controller.runIntegration('pharma', 'monitor');
        log(colors.green, `✓ Pharma: Scraped ${pharmaResult.itemsScraped} items`);
        break;
      }

      case 'test': {
        assertRuntimeConfig('test');
        log(colors.blue, '🧪 Running test suite...\n');
        const { execSync } = require('node:child_process');
        try {
          const output = execSync('node test-all-integrations.js', { cwd: __dirname + '/..' }).toString();
          console.log(output);
        } catch (error) {
          log(colors.red, `✗ Tests failed: ${error.message}`);
        }
        break;
      }

      case 'schedule':
        assertRuntimeConfig('schedule');
        log(colors.blue, '⏰ Starting scheduled jobs...\n');
        log(colors.yellow, '⚠️  Scheduling for 24 hours. Press Ctrl+C to stop.\n');
        controller.scheduleCompleteWorkflow({
          fdaSchedule: '0 */4 * * *',
          mantleSchedule: '0 */6 * * *',
          pharmaSchedule: '0 0 * * *',
          suppliers: []
        });
        log(colors.green, '✓ All jobs scheduled\n');
        
        // Keep process alive
        process.on('SIGINT', () => {
          log(colors.yellow, '\n⏹️  Stopping scheduled jobs...');
          controller.stopAllJobs();
          process.exit(0);
        });
        break;

      case 'status': {
        log(colors.blue, '📊 Job status:\n');
        const status = controller.getJobStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'logs': {
        log(colors.blue, '📝 Recent log entries:\n');
        const logsDir = path.join(__dirname, '..', 'logs');
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          console.log(`Found ${files.length} log files:`);
          files.forEach(f => {
            const filePath = path.join(logsDir, f);
            const stat = fs.statSync(filePath);
            console.log(`  - ${f} (${Math.round(stat.size / 1024)}KB)`);
          });
        } else {
          log(colors.yellow, '⚠️  No logs directory found');
        }
        break;
      }

      case 'help':
        showHelp();
        break;

      case 'exit':
      case 'quit':
      case 'q':
        log(colors.green, '👋 Goodbye!');
        process.exit(0);
        break;

      default:
        log(colors.red, `✗ Unknown command: ${command}`);
        log(colors.yellow, 'Type "help" for available commands');
    }
  } catch (error) {
    log(colors.red, `✗ Error: ${error.message}`);
  }
}

function showHelp() {
  title('OpenClaw HCC Integration - Help');
  const configStatus = validateRuntimeConfig('health');
  
  console.log('COMMANDS:\n');
  
  console.log('health');
  console.log('  Check the health of all HCC system APIs');
  console.log('  Shows: status, items found, error messages\n');
  
  console.log('fda');
  console.log('  Run FDA compliance monitoring once');
  console.log('  Scrapes guidance, warnings, and updates\n');
  
  console.log('mantle');
  console.log('  Run Mantle inventory sync once');
  console.log('  Syncs supplier pricing and inventory\n');
  
  console.log('pharma');
  console.log('  Run Pharma compliance monitoring once');
  console.log('  Scrapes approvals and announcements\n');
  
  console.log('test');
  console.log('  Run automated test suite');
  console.log('  Tests all integrations and logging\n');
  
  console.log('schedule');
  console.log('  Start automated scheduled jobs');
  console.log('  Runs integrations on schedule (Ctrl+C to stop)\n');
  
  console.log('status');
  console.log('  Show current job status');
  console.log('  Shows running jobs and statistics\n');
  
  console.log('logs');
  console.log('  View available log files');
  console.log('  Lists all log files and their sizes\n');
  
  console.log('EXAMPLES:\n');
  console.log('  openclaw health');
  console.log('  openclaw fda');
  console.log('  openclaw schedule');
  console.log('  openclaw test\n');
  
  console.log('CONFIGURATION:\n');
  console.log('  Edit .env file to configure API endpoints and tokens');
  console.log('  Required environment variables:');
  console.log('    HCC_FDA_API_URL, HCC_FDA_TOKEN');
  console.log('    HCC_MANTLE_API_URL, HCC_MANTLE_TOKEN');
  console.log('    HCC_PHARMA_API_URL, HCC_PHARMA_TOKEN\n');

  if (configStatus.warnings.length > 0) {
    console.log('CURRENT WARNINGS:\n');
    configStatus.warnings.forEach((warning) => console.log(`  - ${warning}`));
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    const readline = require('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = () => {
      showMenu();
      rl.question(colors.cyan + 'Enter command: ' + colors.reset, async (input) => {
        if (input.toLowerCase() === '0' || input.toLowerCase() === 'exit') {
          log(colors.green, '👋 Goodbye!');
          rl.close();
          process.exit(0);
        }
        await runCommand(input);
        setTimeout(prompt, 1000);
      });
    };

    prompt();
  } else {
    // Command mode
    const command = args.join(' ');
    await runCommand(command);
  }
}

main().catch(error => {
  log(colors.red, `Fatal error: ${error.message}`);
  process.exit(1);
});
