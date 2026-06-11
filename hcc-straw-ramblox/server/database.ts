import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const configuredDbPath = process.env.SQLITE_PATH;

// Database path - defaults to the repo-local data directory.
const dbPath = configuredDbPath
  ? (path.isAbsolute(configuredDbPath)
      ? configuredDbPath
      : path.join(projectRoot, configuredDbPath))
  : path.join(projectRoot, 'data', 'ramblox.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
mkdirSync(dataDir, { recursive: true, mode: 0o755 });

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable JSON1 functions (available in SQLite 3.38+)
try {
  db.pragma('enable_json1 = ON');
} catch (error) {
  console.warn('JSON1 extension not available, using text for JSON', error);
}

/**
 * Database Schema - embedded SQL
 */
export const DB_SCHEMA = `
/**
 * Ramblox - SQLite3 Database Schema
 * 
 * Converted from PostgreSQL for local-first development
 * Uses SQLite with UUID-like identifiers and JSON support
 */

-- Enable JSON1 extension for JSON support
-- Note: SQLite has built-in JSON support in version 3.38+

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Game passes (monetization)
CREATE TABLE IF NOT EXISTS game_passes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK(price > 0),
  sales_count INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deleted')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSON,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- AI generated assets
CREATE TABLE IF NOT EXISTS ai_generated_assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('model', 'texture', 'material')),
  format TEXT NOT NULL CHECK(format IN ('gltf', 'png', 'jpg', 'obj')),
  prompt TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSON,
  status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Player sessions table (for analytics)
CREATE TABLE IF NOT EXISTS player_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  duration_seconds INTEGER,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_passes_game_id ON game_passes(game_id);
CREATE INDEX IF NOT EXISTS idx_analytics_game_id ON analytics_events(game_id);
CREATE INDEX IF NOT EXISTS idx_analytics_player_id ON analytics_events(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_assets_user_id ON ai_generated_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_assets_type ON ai_generated_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_sessions_game_player ON player_sessions(game_id, player_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_updated_at AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_games_updated_at AFTER UPDATE ON games
BEGIN
  UPDATE games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_game_passes_updated_at AFTER UPDATE ON game_passes
BEGIN
  UPDATE game_passes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ai_assets_updated_at AFTER UPDATE ON ai_generated_assets
BEGIN
  UPDATE ai_generated_assets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
`;

/**
 * Initialize database schema
 * Call this once during startup
 */
export function initializeDatabase(): void {
  db.exec(DB_SCHEMA);
  console.log('✅ SQLite database initialized successfully');
}

/**
 * Get database instance
 */
export function getDb(): Database.Database {
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
  console.log('🔒 SQLite database closed');
}

// Initialize on module load
try {
  initializeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
