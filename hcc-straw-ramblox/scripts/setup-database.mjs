/**
 * Database setup script
 * Run this to initialize SQLite database
 * 
 * Usage:
 *   node scripts/setup-database.mjs
 */

import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Setting up Ramblox SQLite Database...\n');

// Create data directory
const dataDir = join(projectRoot, 'data');
mkdirSync(dataDir, { recursive: true, mode: 0o755 });
console.log('✅ Data directory created:', dataDir);

// Import Database
const Database = (await import('better-sqlite3')).default;

const dbPath = join(dataDir, 'ramblox.db');
const db = new Database(dbPath);

console.log('📦 Database file created:', dbPath);

// Enable features
console.log('⚙️  Enabling SQLite features...');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

try {
  db.pragma('enable_json1 = ON');
  console.log('✅ JSON1 extension enabled');
} catch (e) {
  console.log('⚠️  JSON1 not available (SQLite < 3.38)');
}

// Read and execute schema
console.log('📜 Executing database schema...');
const schemaPath = join(projectRoot, 'server', 'sqlite-schema.sql');
const schemaSql = readFileSync(schemaPath, 'utf8');

try {
  db.exec(schemaSql);
  console.log('✅ Schema executed successfully\n');
} catch (error) {
  console.error('❌ Schema execution failed:', error.message);
  db.close();
  process.exit(1);
}

// Verify tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

console.log('📋 Tables created:', tables.length);
tables.forEach(t => {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`   - ${t.name} (${cols.length} columns)`);
});

// Create admin user (optional - for testing)
console.log('\n👤 Creating test admin user...');
const bcrypt = (await import('bcrypt')).default;

try {
  const password = await bcrypt.hash('admin123', 12);
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin-user-id-12345',
    'admin@ramblox.test',
    'admin',
    password,
    'Administrator',
    new Date().toISOString(),
    new Date().toISOString()
  );

  console.log('✅ Admin user created:');
  console.log('   Email: admin@ramblox.test');
  console.log('   Password: admin123');
  console.log('   ⚠️  Change password immediately!\n');
} catch (error) {
  console.log('⚠️  Admin user already exists or creation failed');
}

// Create sample games
console.log('\n🎮 Creating sample games...');
const insertGame = db.prepare(`
  INSERT INTO games (id, creator_id, name, description, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const sampleGames = [
  {
    id: 'sample-game-12345',
    name: 'My First Adventure Game',
    description: 'A sample game created with Ramblox',
  },
  {
    id: 'sample-game-67890',
    name: 'Obby Challenge',
    description: 'A parkour obstacle course',
  },
  {
    id: 'sample-game-11111',
    name: 'Tycoon Simulator',
    description: 'Build and manage your own tycoon',
  }
];

sampleGames.forEach((game, idx) => {
  insertGame.run(
    game.id,
    'admin-user-id-12345',
    game.name,
    game.description,
    'draft',
    new Date().toISOString(),
    new Date().toISOString()
  );
  console.log(`   ✅ Created: ${game.name}`);
});

// Create sample game passes
console.log('\n💰 Creating sample game passes...');
const insertPass = db.prepare(`
  INSERT INTO game_passes (id, game_id, name, description, price, sales_count, total_revenue, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const samplePasses = [
  {
    id: 'pass-sword-001',
    game_id: 'sample-game-12345',
    name: 'Legendary Sword',
    description: 'Powerful weapon for adventures',
    price: 299,
  },
  {
    id: 'pass-mount-002',
    game_id: 'sample-game-12345',
    name: 'Fast Mount',
    description: 'Faster movement speed',
    price: 199,
  },
  {
    id: 'pass-buff-003',
    game_id: 'sample-game-67890',
    name: 'Extra Life',
    description: 'One extra life in the obby',
    price: 99,
  }
];

samplePasses.forEach((pass, idx) => {
  insertPass.run(
    pass.id,
    pass.game_id,
    pass.name,
    pass.description,
    pass.price,
    0,
    0,
    'active',
    new Date().toISOString(),
    new Date().toISOString()
  );
  console.log(`   ✅ Created: ${pass.name} ($${pass.price})`);
});

// Create sample analytics events
console.log('\n📊 Creating sample analytics events...');
const insertEvent = db.prepare(`
  INSERT INTO analytics_events (id, game_id, player_id, event_type, event_data, session_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const sampleEvents = [
  {
    game_id: 'sample-game-12345',
    player_id: 'player-001',
    event_type: 'game_start',
    data: { session_id: 'session-001', difficulty: 'normal' },
  },
  {
    game_id: 'sample-game-12345',
    player_id: 'player-002',
    event_type: 'game_complete',
    data: { score: 1500, time_seconds: 320 },
  },
  {
    game_id: 'sample-game-67890',
    player_id: 'player-003',
    event_type: 'game_start',
    data: { session_id: 'session-002', level: 1 },
  },
  {
    game_id: 'sample-game-67890',
    player_id: 'player-003',
    event_type: 'level_complete',
    data: { level: 1, stars: 3, time_seconds: 45 },
  },
  {
    game_id: 'sample-game-12345',
    player_id: 'player-001',
    event_type: 'purchase',
    data: { item: 'Legendary Sword', price: 299 },
  }
];

sampleEvents.forEach((evt, idx) => {
  insertEvent.run(
    `event-${idx + 1}`,
    evt.game_id,
    evt.player_id,
    evt.event_type,
    JSON.stringify(evt.data),
    evt.data?.session_id || null,
    new Date(Date.now() - idx * 3600000).toISOString() // Stagger by hour
  );
  console.log(`   ✅ Created: ${evt.event_type} for ${evt.player_id}`);
});

db.close();
console.log('\n🎉 Database setup complete!');
console.log('📍 Database location:', dbPath);
console.log(`\n📊 Summary:`);
console.log(`   - ${tables.length} tables created`);
console.log(`   - 1 admin user created`);
console.log(`   - ${sampleGames.length} sample games`);
console.log(`   - ${samplePasses.length} sample game passes`);
console.log(`   - ${sampleEvents.length} sample analytics events`);
console.log('\nNext steps:');
console.log('  1. Test the API: pnpm dev');
console.log('  2. Visit: http://localhost:3000');
console.log('  3. Test auth: See testing guide below');
