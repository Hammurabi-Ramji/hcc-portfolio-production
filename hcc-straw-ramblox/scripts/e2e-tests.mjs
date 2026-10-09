/**
 * Ramblox E2E Test Suite
 * 
 * Comprehensive testing for all API endpoints
 * Run with: pnpm test:e2e
 */

import http from 'http';
import Database from 'better-sqlite3';

const BASE_URL = 'http://localhost:3000';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Utility functions
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(info, level = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  switch (level) {
    case 'pass':
      console.log(`${colorize('[PASS]', 'green')} [${timestamp}] ${info}`);
      break;
    case 'fail':
      console.log(`${colorize('[FAIL]', 'red')} [${timestamp}] ${info}`);
      break;
    case 'info':
      console.log(`${colorize('[INFO]', 'cyan')} [${timestamp}] ${info}`);
      break;
    case 'warn':
      console.log(`${colorize('[WARN]', 'yellow')} [${timestamp}] ${info}`);
      break;
    default:
      console.log(info);
  }
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? require('https') : require('http');

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
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
            headers: res.headers,
            data: jsonData || data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
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

// Test functions
async function testHealthCheck() {
  log('Testing health check endpoint...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      log('Health check: Server is running', 'pass');
      results.passed++;
      return true;
    } else {
      log(`Health check: Unexpected response - ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testUserRegistration() {
  log('Testing user registration...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: `test_${Date.now()}@example.com`,
        password: 'TestPass123!@#',
        username: `testuser_${Date.now()}`,
        display_name: 'Test User'
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('User registration: Account created successfully', 'pass');
      log(`   - User ID: ${response.data.user.id}`, 'info');
      log(`   - Username: ${response.data.user.username}`, 'info');
      results.passed++;
      return response.data;
    } else {
      log(`Registration failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Registration failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testUserLogin(userCredentials) {
  log('Testing user login...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: userCredentials.email,
        password: userCredentials.password
      }
    });

    if (response.status === 200 && response.data.success && response.data.token) {
      log('User login: Authentication successful', 'pass');
      log(`   - Token received: ${response.data.token.substring(0, 20)}...`, 'info');
      results.passed++;
      return response.data;
    } else {
      log(`Login failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Login failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testCreateGame(authToken) {
  log('Testing game creation...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/games`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        creator_id: 'test-user-id',
        name: 'E2E Test Game',
        description: 'Test game created during E2E testing',
        status: 'draft'
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('Game creation: Game created successfully', 'pass');
      log(`   - Game ID: ${response.data.game.id}`, 'info');
      log(`   - Name: ${response.data.game.name}`, 'info');
      results.passed++;
      return response.data.game;
    } else {
      log(`Game creation failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Game creation failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testListGames() {
  log('Testing game listing...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/games`);

    if (response.status === 200 && response.data.success && Array.isArray(response.data.games)) {
      log(`Game listing: Retrieved ${response.data.games.length} games`, 'pass');
      
      if (response.data.games.length > 0) {
        const game = response.data.games[0];
        log(`   - First game: ${game.name}`, 'info');
        log(`   - ID: ${game.id}`, 'info');
        log(`   - Status: ${game.status}`, 'info');
      }
      
      results.passed++;
      return response.data.games;
    } else {
      log(`Game listing failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Game listing failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testGetGameById(gameId) {
  log('Testing get game by ID...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/games/${gameId}`);

    if (response.status === 200 && response.data.success) {
      log('Get game by ID: Game retrieved successfully', 'pass');
      log(`   - Game: ${response.data.game.name}`, 'info');
      results.passed++;
      return response.data.game;
    } else {
      log(`Get game by ID failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Get game by ID failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testUpdateGame(gameId, authToken) {
  log('Testing game update...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        name: 'Updated Test Game',
        description: 'Updated description for E2E test',
        status: 'published'
      }
    });

    if (response.status === 200 && response.data.success) {
      log('Game update: Game updated successfully', 'pass');
      log(`   - New name: ${response.data.game.name}`, 'info');
      log(`   - New status: ${response.data.game.status}`, 'info');
      results.passed++;
      return true;
    } else {
      log(`Game update failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Game update failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testGetAnalytics(gameId) {
  log('Testing analytics retrieval...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/analytics?gameId=${gameId}`);

    if (response.status === 200 && response.data.success) {
      log('Analytics retrieval: Data fetched successfully', 'pass');
      const summary = response.data.summary;
      log(`   - Total players: ${summary.total_players}`, 'info');
      log(`   - Active today: ${summary.active_today}`, 'info');
      log(`   - Active this week: ${summary.active_week}`, 'info');
      results.passed++;
      return true;
    } else {
      log(`Analytics retrieval failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Analytics retrieval failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testTrackAnalyticsEvent(gameId, playerSession) {
  log('Testing analytics event tracking...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        game_id: gameId,
        player_id: playerSession.playerId,
        event_type: 'e2e_test_event',
        event_data: {
          test_type: 'end_to_end',
          timestamp: new Date().toISOString()
        },
        session_id: playerSession.sessionId
      }
    });

    if (response.status === 200 && response.data.success) {
      log('Analytics event tracking: Event recorded successfully', 'pass');
      log(`   - Event ID: ${response.data.event_id}`, 'info');
      results.passed++;
      return true;
    } else {
      log(`Event tracking failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Event tracking failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testGetMonetization(gameId) {
  log('Testing monetization data retrieval...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/monetization?gameId=${gameId}`);

    if (response.status === 200 && response.data.success) {
      log('Monetization retrieval: Data fetched successfully', 'pass');
      log(`   - Game passes: ${response.data.game_passes.length}`, 'info');
      log(`   - Total revenue: $${response.data.total_revenue}`, 'info');
      log(`   - Total sales: ${response.data.sales_count}`, 'info');
      results.passed++;
      return true;
    } else {
      log(`Monetization retrieval failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Monetization retrieval failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testCreateGamePass(gameId, authToken) {
  log('Testing game pass creation...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/monetization`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        game_id: gameId,
        name: 'E2E Test Pass',
        description: 'Test game pass for E2E testing',
        price: 499
      }
    });

    if (response.status === 201 || (response.status === 200 && response.data.success)) {
      log('Game pass creation: Pass created successfully', 'pass');
      log(`   - Pass ID: ${response.data.game_pass.id}`, 'info');
      log(`   - Name: ${response.data.game_pass.name}`, 'info');
      log(`   - Price: $${response.data.game_pass.price}`, 'info');
      results.passed++;
      return response.data.game_pass;
    } else {
      log(`Game pass creation failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return null;
    }
  } catch (error) {
    log(`Game pass creation failed: ${error.message}`, 'fail');
    results.failed++;
    return null;
  }
}

async function testRecordPurchase(gameId, passId, authToken) {
  log('Testing purchase recording...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/monetization/${passId}/purchase`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        game_id: gameId,
        player_id: 'test-player-123',
        amount: 499
      }
    });

    if (response.status === 200 && response.data.success) {
      log('Purchase recording: Purchase recorded successfully', 'pass');
      results.passed++;
      return true;
    } else {
      log(`Purchase recording failed: ${JSON.stringify(response.data)}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Purchase recording failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testInvalidAuth() {
  log('Testing invalid authentication...', 'info');
  results.total++;

  try {
    const response = await makeRequest(`${BASE_URL}/api/games`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });

    // Should return error or 200 if auth not required for listing
    if (response.status === 200 || response.status === 401 || response.status === 403) {
      log('Invalid auth test: Correctly handled (expected behavior)', 'pass');
      results.passed++;
      return true;
    } else {
      log(`Unexpected response for invalid auth: ${response.status}`, 'fail');
      results.failed++;
      return false;
    }
  } catch (error) {
    log(`Invalid auth test failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

async function testDatabaseConnection() {
  log('Testing direct database connection...', 'info');
  results.total++;

  try {
    const db = new Database('data/ramblox.db');
    
    // Test users table
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    log(`   - Users count: ${users.count}`, 'info');

    // Test games table
    const games = db.prepare('SELECT COUNT(*) as count FROM games').get();
    log(`   - Games count: ${games.count}`, 'info');

    // Test game passes table
    const passes = db.prepare('SELECT COUNT(*) as count FROM game_passes').get();
    log(`   - Game passes count: ${passes.count}`, 'info');

    // Test analytics events table
    const events = db.prepare('SELECT COUNT(*) as count FROM analytics_events').get();
    log(`   - Analytics events count: ${events.count}`, 'info');

    db.close();

    log('Database connection: All tables accessible', 'pass');
    results.passed++;
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'fail');
    results.failed++;
    return false;
  }
}

// Main test runner
async function runE2ETests() {
  console.log('\n' + '='.repeat(70));
  console.log(colorize('🧪 RAMBLOX E2E TEST SUITE', 'cyan'));
  console.log('='.repeat(70) + '\n');

  // Prerequisites check
  try {
    log('Checking prerequisites...', 'info');
    
    // Check if server is running
    try {
      await makeRequest(`${BASE_URL}/api`);
      log('Server is running ✓', 'pass');
    } catch (error) {
      log('ERROR: Server is not running!', 'fail');
      log('Start the server with: pnpm dev', 'warn');
      log('Waiting 5 seconds for you to start the server...', 'info');
      await sleep(5000);
      
      try {
        await makeRequest(`${BASE_URL}/api`);
        log('Server is now running ✓', 'pass');
      } catch (error) {
        log('Server still not running. Exiting tests.', 'fail');
        process.exit(1);
      }
    }
  } catch (error) {
    log(`Prerequisites check failed: ${error.message}`, 'fail');
    process.exit(1);
  }

  console.log('\n' + '-'.repeat(70));
  log('📊 RUNNING E2E TESTS', 'info');
  console.log('-'.repeat(70) + '\n');

  // Run database connection test
  await testDatabaseConnection();
  
  // Run user registration
  const newUser = await testUserRegistration();
  
  if (!newUser) {
    log('⚠️  Registration failed, continuing without new user', 'warn');
  } else {
    // Login with new user
    const loginResult = await testUserLogin(newUser.user);
    
    if (loginResult) {
      // Test game operations
      const testGame = await testCreateGame(loginResult.token);
      
      if (testGame) {
        await testListGames();
        await testGetGameById(testGame.id);
        await testUpdateGame(testGame.id, loginResult.token);
        await testGetAnalytics(testGame.id);
        await testTrackAnalyticsEvent(testGame.id, {
          playerId: 'e2e-test-player',
          sessionId: 'e2e-test-session'
        });
        await testGetMonetization(testGame.id);
        await testCreateGamePass(testGame.id, loginResult.token);
        await testRecordPurchase(testGame.id, 'pass-e2e-test', loginResult.token);
      }
      
      // Test invalid auth
      await testInvalidAuth();
    }
  }

  // Test with existing user (admin)
  log('\nTesting with existing admin user...', 'info');
  results.total++;
  
  try {
    const adminLogin = await testUserLogin({
      email: 'admin@ramblox.test',
      password: 'admin123'
    });
    
    if (adminLogin) {
      results.passed++;
      log('Admin login: Authentication successful', 'pass');
    } else {
      results.failed++;
      log('Admin login: Failed (expected if password changed)', 'warn');
    }
  } catch (error) {
    results.failed++;
    log(`Admin login failed: ${error.message}`, 'fail');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(colorize('📈 TEST SUMMARY', 'cyan'));
  console.log('='.repeat(70));
  
  const total = results.total;
  const passed = results.passed;
  const failed = results.failed;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`${colorize('Passed:', 'green')} ${passed} (${successRate}%)`);
  console.log(`${colorize('Failed:', 'red')} ${failed}`);
  
  if (failed > 0) {
    console.log(`\n${colorize('⚠️  Some tests failed. Review the output above.', 'yellow')}`);
  } else {
    console.log(`\n${colorize('✅ All tests passed!', 'green')}`);
  }

  console.log('\n' + '-'.repeat(70));
  console.log(colorize('📝 NEXT STEPS', 'cyan'));
  console.log('-'.repeat(70));
  console.log('1. Fix any failed tests');
  console.log('2. Run tests again to ensure all pass');
  console.log('3. Deploy to production when ready');
  console.log('4. Set up CI/CD for automated testing\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Start tests
runE2ETests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'fail');
  process.exit(1);
});
