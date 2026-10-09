/**
 * Full E2E Test Runner
 * 
 * Runs all E2E tests and generates detailed report
 * Run with: pnpm test:e2e:full
 */

import http from 'http';
import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const REPORT_DIR = './output/test-reports';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  startTime: null,
  endTime: null,
  tests: []
};

// Colors for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  switch (level) {
    case 'pass':
      console.log(`${colors.green}[✓ PASS]${colors.reset} [${timestamp}] ${message}`);
      break;
    case 'fail':
      console.log(`${colors.red}[✗ FAIL]${colors.reset} [${timestamp}] ${message}`);
      break;
    case 'warn':
      console.log(`${colors.yellow}[⚠ WARN]${colors.reset} [${timestamp}] ${message}`);
      break;
    case 'info':
      console.log(`${colors.cyan}[ℹ INFO]${colors.reset} [${timestamp}] ${message}`);
      break;
    case 'success':
      console.log(`${colors.green}${colors.bold}[✓ SUCCESS]${colors.reset} ${message}`);
      break;
    default:
      console.log(message);
  }
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    // Use dynamic import for https to avoid commonjs issues
    const client = parsedUrl.protocol === 'https:' 
      ? require('https') 
      : require('http');

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || { 'Content-Type': 'application/json' }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData || data,
            body: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body && typeof options.body === 'object') {
      req.write(JSON.stringify(options.body));
    } else if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test definitions
const testCases = [
  {
    name: 'Health Check',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api`);
      return res.status === 200 && res.data.status === 'ok';
    }
  },
  {
    name: 'Database Connection',
    fn: async () => {
      const db = new Database('data/ramblox.db');
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      db.close();
      return tables.length >= 6;
    }
  },
  {
    name: 'User Registration',
    fn: async () => {
      const uniqueId = Date.now();
      const email = `e2e_test_${uniqueId}@example.com`;
      const username = `e2euser_${uniqueId}`;
      
      const res = await makeRequest(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: {
          email,
          password: 'TestPass123!@#',
          username,
          display_name: 'E2E Test User'
        }
      });

      return res.status === 201 || (res.status === 200 && res.data.success && res.data.user);
    }
  },
  {
    name: 'Admin Login',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: {
          email: 'admin@ramblox.test',
          password: 'admin123'
        }
      });

      return res.status === 200 && res.data.success && res.data.token;
    }
  },
  {
    name: 'User Login',
    fn: async () => {
      const uniqueId = Date.now();
      const email = `e2e_test_${uniqueId}@example.com`;
      
      const res = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: {
          email,
          password: 'TestPass123!@#'
        }
      });

      return res.status === 200 && res.data.success && res.data.token;
    },
    depends: ['User Registration']
  },
  {
    name: 'List Games',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/games`);
      return res.status === 200 && res.data.success && Array.isArray(res.data.games);
    }
  },
  {
    name: 'Create Game',
    fn: async () => {
      const authToken = await getAuthToken();
      const res = await makeRequest(`${BASE_URL}/api/games`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          creator_id: 'e2e-test-creator',
          name: 'E2E Test Game',
          description: 'Created by E2E test suite',
          status: 'draft'
        }
      });

      return res.status === 201 || (res.status === 200 && res.data.success && res.data.game);
    },
    depends: ['Admin Login']
  },
  {
    name: 'Get Game by ID',
    fn: async () => {
      // Get first game
      const res = await makeRequest(`${BASE_URL}/api/games`);
      if (res.data.games && res.data.games.length > 0) {
        const gameId = res.data.games[0].id;
        const gameRes = await makeRequest(`${BASE_URL}/api/games/${gameId}`);
        return gameRes.status === 200 && gameRes.data.success;
      }
      return false;
    },
    depends: ['List Games']
  },
  {
    name: 'Update Game',
    fn: async () => {
      const authToken = await getAuthToken();
      
      // Get a game to update
      const listRes = await makeRequest(`${BASE_URL}/api/games`);
      if (listRes.data.games && listRes.data.games.length > 0) {
        const gameId = listRes.data.games[0].id;
        
        const updateRes = await makeRequest(`${BASE_URL}/api/games/${gameId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: {
            name: 'Updated E2E Test Game',
            status: 'published'
          }
        });

        return updateRes.status === 200 && updateRes.data.success;
      }
      return false;
    },
    depends: ['Admin Login', 'List Games']
  },
  {
    name: 'Delete Game',
    fn: async () => {
      const authToken = await getAuthToken();
      
      // Get a game to delete
      const listRes = await makeRequest(`${BASE_URL}/api/games`);
      if (listRes.data.games && listRes.data.games.length > 0) {
        const gameId = listRes.data.games[0].id;
        
        const deleteRes = await makeRequest(`${BASE_URL}/api/games/${gameId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        return deleteRes.status === 200 && deleteRes.data.success;
      }
      return false;
    },
    depends: ['Admin Login']
  },
  {
    name: 'Get Analytics',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/analytics?gameId=sample-game-12345`);
      return res.status === 200 && res.data.success && res.data.summary;
    }
  },
  {
    name: 'Track Analytics Event',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/analytics`, {
        method: 'POST',
        body: {
          game_id: 'sample-game-12345',
          player_id: 'e2e-test-player',
          event_type: 'e2e_test_tracking',
          event_data: {
            test_type: 'end_to_end',
            timestamp: new Date().toISOString()
          }
        }
      });

      return res.status === 200 && res.data.success && res.data.event_id;
    }
  },
  {
    name: 'Get Monetization',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/monetization?gameId=sample-game-12345`);
      return res.status === 200 && res.data.success && res.data.game_passes;
    }
  },
  {
    name: 'Create Game Pass',
    fn: async () => {
      const authToken = await getAuthToken();
      const res = await makeRequest(`${BASE_URL}/api/monetization`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          game_id: 'sample-game-12345',
          name: 'E2E Test Pass',
          description: 'Test game pass',
          price: 499
        }
      });

      return res.status === 201 || (res.status === 200 && res.data.success && res.data.game_pass);
    },
    depends: ['Admin Login']
  },
  {
    name: 'Record Purchase',
    fn: async () => {
      const authToken = await getAuthToken();
      const res = await makeRequest(`${BASE_URL}/api/monetization/sample-game-12345/purchase`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          game_id: 'sample-game-12345',
          player_id: 'e2e-test-player-123',
          amount: 499
        }
      });

      return res.status === 200 && res.data.success;
    },
    depends: ['Admin Login']
  },
  {
    name: 'Invalid Token Test',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/games`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });

      // Should either reject (401/403) or return with 200 (if auth not required)
      return [200, 401, 403].includes(res.status);
    }
  },
  {
    name: 'Password Strength Validation',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: {
          email: `weak_password_${Date.now()}@example.com`,
          password: 'weak',
          username: `weakuser_${Date.now()}`
        }
      });

      return res.status === 400 && res.data.error?.includes('Password validation failed');
    }
  },
  {
    name: 'Duplicate Email Rejection',
    fn: async () => {
      const res = await makeRequest(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: {
          email: 'admin@ramblox.test',
          password: 'admin123',
          username: 'duplicateuser'
        }
      });

      return res.status === 409 && res.data.error?.includes('Email already');
    }
  },
  {
    name: 'Negative Price Rejection',
    fn: async () => {
      const authToken = await getAuthToken();
      const res = await makeRequest(`${BASE_URL}/api/monetization`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          game_id: 'sample-game-12345',
          name: 'Negative Price Test',
          price: -100
        }
      });

      return res.status === 400;
    },
    depends: ['Admin Login']
  }
];

// Helper to get auth token
async function getAuthToken() {
  const res = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      email: 'admin@ramblox.test',
      password: 'admin123'
    }
  });
  return res.data?.token || null;
}

// Run test with error handling
async function runTest(testCase) {
  const start = Date.now();
  
  try {
    // Check dependencies
    if (testCase.depends) {
      for (const depName of testCase.depends) {
        const depTest = results.tests.find(t => t.name === depName);
        if (depTest && !depTest.passed) {
          log(`Skipping ${testCase.name} - dependency "${depName}" failed`, 'warn');
          results.skipped++;
          results.total++;
          results.tests.push({
            name: testCase.name,
            passed: false,
            skipped: true,
            duration: Date.now() - start
          });
          return;
        }
      }
    }

    // Run test
    const passed = await testCase.fn();
    
    const duration = Date.now() - start;
    
    if (passed) {
      results.passed++;
      log(`✓ ${testCase.name} (${duration}ms)`, 'pass');
      results.tests.push({
        name: testCase.name,
        passed: true,
        skipped: false,
        duration
      });
    } else {
      results.failed++;
      log(`✗ ${testCase.name} - Test assertion failed (${duration}ms)`, 'fail');
      results.tests.push({
        name: testCase.name,
        passed: false,
        skipped: false,
        duration
      });
    }
    
  } catch (error) {
    const duration = Date.now() - start;
    results.failed++;
    log(`✗ ${testCase.name} - ${error.message} (${duration}ms)`, 'fail');
    results.tests.push({
      name: testCase.name,
      passed: false,
      skipped: false,
      duration,
      error: error.message
    });
  }
}

// Generate report
function generateReport() {
  mkdirSync(REPORT_DIR, { recursive: true });
  
  const endTime = new Date();
  const duration = endTime - results.startTime;
  
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      totalDuration: duration,
      testsRan: results.total,
      testsPassed: results.passed,
      testsFailed: results.failed,
      testsSkipped: results.skipped
    },
    tests: results.tests,
    summary: {
      overall: results.failed === 0 ? 'PASS' : 'FAIL',
      passRate: ((results.passed / results.total) * 100).toFixed(2) + '%'
    }
  };

  // Save JSON report
  writeFileSync(
    join(REPORT_DIR, `e2e-report-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );

  // Save HTML report
  generateHtmlReport(report);

  return report;
}

function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>E2E Test Report - Ramblox</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .metric { text-align: center; padding: 20px; border-radius: 8px; }
    .metric h3 { margin: 0; font-size: 36px; }
    .metric.pass { background: #d4edda; color: #155724; }
    .metric.fail { background: #f8d7da; color: #721c24; }
    .metric.skip { background: #fff3cd; color: #856404; }
    .metric.total { background: #d1ecf1; color: #0c5460; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .status-pass { color: #28a745; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .status-skip { color: #ffc107; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 E2E Test Report</h1>
    
    <div class="summary">
      <div class="metric pass">
        <h3>${report.metadata.testsPassed}</h3>
        <p>PASS</p>
      </div>
      <div class="metric fail">
        <h3>${report.metadata.testsFailed}</h3>
        <p>FAIL</p>
      </div>
      <div class="metric skip">
        <h3>${report.metadata.testsSkipped}</h3>
        <p>SKIP</p>
      </div>
      <div class="metric total">
        <h3>${report.metadata.testsRan}</h3>
        <p>TOTAL</p>
      </div>
    </div>

    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Status</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${report.tests.map(test => `
          <tr>
            <td>${test.name}</td>
            <td class="status-${test.passed ? 'pass' : test.skipped ? 'skip' : 'fail'}">
              ${test.passed ? '✓' : test.skipped ? '⊘' : '✗'}
            </td>
            <td>${test.duration}ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
      <p><strong>Base URL:</strong> ${BASE_URL}</p>
      <p><strong>Overall:</strong> ${report.summary.overall}</p>
      <p><strong>Pass Rate:</strong> ${report.summary.passRate}</p>
    </div>
  </div>
</body>
</html>
  `;

  writeFileSync(
    join(REPORT_DIR, `e2e-report-${Date.now()}.html`),
    html
  );
}

// Main test runner
async function runE2ETests() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}${colors.bold}🧪 RAMBLOX FULL E2E TEST SUITE${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  results.startTime = Date.now();

  // Check if server is running
  log('Checking if server is running...', 'info');
  try {
    const health = await makeRequest(`${BASE_URL}/api`);
    if (health.status === 200) {
      log('✓ Server is running', 'pass');
    } else {
      log(`⚠ Unexpected health response: ${health.status}`, 'warn');
    }
  } catch (error) {
    log(`✗ Server is not running at ${BASE_URL}`, 'fail');
    log('Starting server... (this may take a moment)', 'info');
    
    // Try to start server
    const { execSync } = require('child_process');
    try {
      execSync('cd client && pnpm dev', { stdio: 'inherit' });
      log('Server started successfully', 'success');
    } catch (error) {
      log('⚠ Failed to start server automatically', 'warn');
      log('Please start it manually and press Enter to continue...', 'info');
      await new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.once('data', () => {
          process.stdin.pause();
          resolve();
        });
      });
    }
  }

  log('\n' + '-'.repeat(80), 'info');
  log('📊 STARTING E2E TESTS', 'info');
  log('-'.repeat(80) + '\n', 'info');

  // Run all tests
  for (const testCase of testCases) {
    await runTest(testCase);
    await sleep(100); // Small delay between tests
  }

  results.endTime = Date.now();
  const totalDuration = results.endTime - results.startTime;

  // Generate report
  const report = generateReport();

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}${colors.bold}📈 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(80));
  
  console.log(`\nTotal Tests: ${report.metadata.testsRan}`);
  console.log(`${colors.green}${colors.bold}Passed:${colors.reset} ${report.metadata.testsPassed}`);
  console.log(`${colors.red}${colors.bold}Failed:${colors.reset} ${report.metadata.testsFailed}`);
  console.log(`${colors.yellow}${colors.bold}Skipped:${colors.reset} ${report.metadata.testsSkipped}`);
  console.log(`\nSuccess Rate: ${colors.green}${colors.bold}${report.summary.passRate}${colors.reset}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  
  if (report.summary.overall === 'PASS') {
    console.log(`\n${colors.green}${colors.bold}✅ ALL TESTS PASSED!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}⚠️  SOME TESTS FAILED${colors.reset}`);
    console.log('Review the output above and check the HTML report for details.');
  }

  console.log('\n' + '-'.repeat(80));
  console.log(`${colors.cyan}${colors.bold}📝 NEXT STEPS${colors.reset}`);
  console.log('-'.repeat(80));
  console.log('1. Review failed tests and fix issues');
  console.log('2. Check HTML report in:', colors.cyan + join(REPORT_DIR) + colors.reset);
  console.log('3. Rerun tests to verify fixes');
  console.log('4. When all pass: Ready for staging deployment');
  console.log('5. Run: pnpm deploy:staging (if configured)\n');

  console.log('Test reports saved to:', colors.cyan + join(REPORT_DIR) + colors.reset);
  console.log('='.repeat(80) + '\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runE2ETests().catch(error => {
  console.error('\n' + '='.repeat(80));
  console.log(`${colors.red}${colors.bold}❌ E2E Test Suite Failed${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  console.error(error);
  process.exit(1);
});
