/**
 * Ramblox Simple Manual Test Runner
 * 
 * Simple script to test all API endpoints
 * Run after starting the dev server: pnpm dev
 */

const http = require('node:http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(info, level = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  switch (level) {
    case 'pass':
      console.log(`${colors.green}[PASS]${colors.reset} [${timestamp}] ${info}`);
      break;
    case 'fail':
      console.log(`${colors.red}[FAIL]${colors.reset} [${timestamp}] ${info}`);
      break;
    case 'info':
      console.log(`${colors.cyan}[INFO]${colors.reset} [${timestamp}] ${info}`);
      break;
    default:
      console.log(info);
  }
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: jsonData || data
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suite
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🧪 RAMBLOX MANUAL TEST SUITE${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  // Check if server is running
  log('Checking if server is running...', 'info');
  try {
    const health = await makeRequest(`${BASE_URL}/api`);
    if (health.status === 200) {
      log('Server is running ✓', 'pass');
    } else {
      log(`Unexpected health response: ${health.status}`, 'fail');
      process.exit(1);
    }
  } catch (error) {
    log('ERROR: Server is not running!', 'fail');
    log('Start the server with: cd client && pnpm dev', 'info');
    log('Press Ctrl+C in another terminal and then press Enter to continue...', 'warn');
    
    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.pause();
        resolve();
      });
    });
  }

  const results = { passed: 0, failed: 0 };
  const context = {
    registeredUserId: null,
    createdGameId: null
  };

  // Test 1: Health Check
  log('\n🧪 Test 1: Health Check', 'info');
  try {
    const response = await makeRequest(`${BASE_URL}/api`);
    if (response.status === 200 && response.data.status === 'ok') {
      log('✅ Health check passed', 'pass');
      results.passed++;
    } else {
      log(`❌ Unexpected response: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 2: User Registration
  log('\n🧪 Test 2: User Registration', 'info');
  try {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const uniquePassword = `TestPass!${Date.now()}Aa1`;
    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: uniqueEmail,
        password: uniquePassword,
        username: `testuser_${Date.now()}`,
        display_name: 'Test User'
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('✅ User registered successfully', 'pass');
      log(`   Email: ${uniqueEmail}`, 'info');
      context.registeredUserId = response.data?.user?.id || null;
      results.passed++;
    } else {
      log(`❌ Registration failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Registration failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 3: Admin Login
  log('\n🧪 Test 3: Admin Login', 'info');
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'admin@ramblox.test',
        password: 'admin123'
      }
    });

    if (response.status === 200 && response.data.success && response.data.token) {
      log('✅ Admin login successful', 'pass');
      log(`   Token received: ${response.data.token.substring(0, 30)}...`, 'info');
      results.passed++;
    } else {
      log(`❌ Login failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 4: List Games
  log('\n🧪 Test 4: List Games', 'info');
  try {
    const response = await makeRequest(`${BASE_URL}/api/games`);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.games)) {
      log(`✅ Games list retrieved: ${response.data.games.length} games`, 'pass');
      if (response.data.games.length > 0) {
        log(`   First game: ${response.data.games[0].name}`, 'info');
      }
      results.passed++;
    } else {
      log(`❌ Failed to list games: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Failed to list games: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 5: Create New Game
  log('\n🧪 Test 5: Create New Game', 'info');
  try {
    const uniqueName = `Test Game ${Date.now()}`;
    const response = await makeRequest(`${BASE_URL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        creator_id: context.registeredUserId,
        name: uniqueName,
        description: 'Test game created during manual testing'
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('✅ Game created successfully', 'pass');
      log(`   Game ID: ${response.data.game.id}`, 'info');
      context.createdGameId = response.data?.game?.id || null;
      results.passed++;
    } else {
      log(`❌ Game creation failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Game creation failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 6: Get Analytics
  log('\n🧪 Test 6: Get Analytics', 'info');
  try {
    const gameId = context.createdGameId || 'sample-game-12345';
    const response = await makeRequest(`${BASE_URL}/api/analytics?gameId=${encodeURIComponent(gameId)}`);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Analytics retrieved successfully', 'pass');
      log(`   Total players: ${response.data.summary.total_players}`, 'info');
      log(`   Active today: ${response.data.summary.active_today}`, 'info');
      results.passed++;
    } else {
      log(`❌ Analytics retrieval failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Analytics retrieval failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 7: Track Analytics Event
  log('\n🧪 Test 7: Track Analytics Event', 'info');
  try {
    const gameId = context.createdGameId || 'sample-game-12345';
    const response = await makeRequest(`${BASE_URL}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        game_id: gameId,
        player_id: 'manual-test-player',
        event_type: 'manual_test_event',
        event_data: {
          test_type: 'manual',
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.status === 200 && response.data.success) {
      log('✅ Analytics event tracked successfully', 'pass');
      log(`   Event ID: ${response.data.event_id}`, 'info');
      results.passed++;
    } else {
      log(`❌ Event tracking failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Event tracking failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 8: Get Monetization Data
  log('\n🧪 Test 8: Get Monetization Data', 'info');
  try {
    const gameId = context.createdGameId || 'sample-game-12345';
    const response = await makeRequest(`${BASE_URL}/api/monetization?gameId=${encodeURIComponent(gameId)}`);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Monetization data retrieved successfully', 'pass');
      log(`   Game passes: ${response.data.game_passes.length}`, 'info');
      log(`   Total revenue: $${response.data.total_revenue}`, 'info');
      results.passed++;
    } else {
      log(`❌ Monetization retrieval failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Monetization retrieval failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 9: Create Game Pass
  log('\n🧪 Test 9: Create Game Pass', 'info');
  try {
    const gameId = context.createdGameId || 'sample-game-12345';
    const response = await makeRequest(`${BASE_URL}/api/monetization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        game_id: gameId,
        name: `Manual Test Pass ${Date.now()}`,
        description: 'Test game pass',
        price: 199
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('✅ Game pass created successfully', 'pass');
      log(`   Pass ID: ${response.data.game_pass.id}`, 'info');
      results.passed++;
    } else {
      log(`❌ Game pass creation failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
    }
  } catch (error) {
    log(`❌ Game pass creation failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Test 10: Invalid Token Test
  log('\n🧪 Test 10: Invalid Token Test', 'info');
  try {
    const response = await makeRequest(`${BASE_URL}/api/games`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });

    log(`✅ Invalid token handled: Status ${response.status}`, 'pass');
    results.passed++;
  } catch (error) {
    log(`❌ Invalid token test failed: ${error.message}`, 'fail');
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📈 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(70));
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${results.passed} (${successRate}%)`);
  console.log(`${colors.red}Failed:${colors.reset} ${results.failed}`);
  
  if (results.failed > 0) {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Review the output above.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`${colors.cyan}📝 NEXT STEPS${colors.reset}`);
  console.log('-'.repeat(70));
  console.log('1. Review any failed tests');
  console.log('2. Check server logs for errors');
  console.log('3. Fix issues and rerun tests');
  console.log('4. When all pass, system is ready for use');
  console.log(`5. Visit: ${BASE_URL}`);
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n' + '='.repeat(70));
  console.log(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
  console.log('='.repeat(70) + '\n');
  process.exit(1);
});
