/**
 * Ramblox Database Schema - TypeScript Definitions
 * 
 * Type-safe database operations with SQLite
 */

import Database from 'better-sqlite3';

// ============ TYPES ============

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface GamePass {
  id: string;
  game_id: string;
  name: string;
  description?: string;
  price: number;
  sales_count: number;
  total_revenue: number;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  game_id: string;
  player_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  session_id?: string;
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  user_id: string;
  asset_type: 'model' | 'texture' | 'material';
  format: 'gltf' | 'png' | 'jpg' | 'obj';
  prompt: string;
  file_url: string;
  thumbnail_url?: string;
  metadata: Record<string, unknown> | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PlayerSession {
  id: string;
  game_id: string;
  player_id: string;
  session_start: string;
  session_end?: string;
  duration_seconds?: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

export interface CreateGameInput {
  creator_id: string;
  name: string;
  description?: string;
}

export interface CreateGamePassInput {
  game_id: string;
  name: string;
  description?: string;
  price: number;
}

export interface CreateAssetInput {
  user_id: string;
  asset_type: 'model' | 'texture' | 'material';
  format: 'gltf' | 'png' | 'jpg' | 'obj';
  prompt: string;
  file_url: string;
  thumbnail_url?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAnalyticsEventInput {
  game_id: string;
  player_id: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  session_id?: string;
}

// ============ STATEMENTS ============

// Users
export const getUserById = (db: Database.Database) => 
  db.prepare<[string], User>('SELECT * FROM users WHERE id = ?');

export const getUserByEmail = (db: Database.Database) =>
  db.prepare<[string], User>('SELECT * FROM users WHERE email = ?');

export const getUserByUsername = (db: Database.Database) =>
  db.prepare<[string], User>('SELECT * FROM users WHERE username = ?');

export const createUser = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

export const updateUser = (db: Database.Database) =>
  db.prepare(`
    UPDATE users 
    SET email = ?, username = ?, display_name = ?, updated_at = ?
    WHERE id = ?
  `);

export const deleteUser = (db: Database.Database) =>
  db.prepare('DELETE FROM users WHERE id = ?');

// Games
export const getGameById = (db: Database.Database) =>
  db.prepare<[string], Game>('SELECT * FROM games WHERE id = ?');

export const getGamesByCreator = (db: Database.Database) =>
  db.prepare<[string], Game>('SELECT * FROM games WHERE creator_id = ? ORDER BY created_at DESC');

export const getPublishedGames = (db: Database.Database) =>
  db.prepare<[Game['status']], Game>('SELECT * FROM games WHERE status = ? ORDER BY created_at DESC');

export const createGame = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO games (id, creator_id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

export const updateGame = (db: Database.Database) =>
  db.prepare(`
    UPDATE games 
    SET name = ?, description = ?, status = ?, updated_at = ?
    WHERE id = ?
  `);

export const deleteGame = (db: Database.Database) =>
  db.prepare('DELETE FROM games WHERE id = ?');

// Game Passes
export const getGamePassById = (db: Database.Database) =>
  db.prepare<[string], GamePass>('SELECT * FROM game_passes WHERE id = ?');

export const getGamePassesByGame = (db: Database.Database) =>
  db.prepare<[string, GamePass['status']], GamePass>('SELECT * FROM game_passes WHERE game_id = ? AND status != ? ORDER BY price DESC');

export const createGamePass = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO game_passes (id, game_id, name, description, price, sales_count, total_revenue, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

export const updateGamePass = (db: Database.Database) =>
  db.prepare(`
    UPDATE game_passes 
    SET name = ?, price = ?, status = ?, updated_at = ?
    WHERE id = ?
  `);

export const incrementGamePassSales = (db: Database.Database) =>
  db.prepare(`
    UPDATE game_passes 
    SET sales_count = sales_count + ?, total_revenue = total_revenue + ?, updated_at = ?
    WHERE id = ?
  `);

// Analytics Events
export const getAnalyticsEvents = (db: Database.Database) =>
  db.prepare('SELECT * FROM analytics_events WHERE game_id = ? ORDER BY created_at DESC LIMIT ?');

export const getAnalyticsSummary = (db: Database.Database) =>
  db.prepare(`
    SELECT 
      COUNT(DISTINCT player_id) as total_players,
      COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as active_today,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as active_week
    FROM analytics_events 
    WHERE game_id = ?
  `);

export const createAnalyticsEvent = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO analytics_events (id, game_id, player_id, event_type, event_data, session_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

// AI Assets
export const getAssetById = (db: Database.Database) =>
  db.prepare('SELECT * FROM ai_generated_assets WHERE id = ?');

export const getAssetsByUser = (db: Database.Database) =>
  db.prepare('SELECT * FROM ai_generated_assets WHERE user_id = ? ORDER BY created_at DESC');

export const getAssetsByType = (db: Database.Database) =>
  db.prepare('SELECT * FROM ai_generated_assets WHERE asset_type = ? AND status = ? ORDER BY created_at DESC');

export const createAsset = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO ai_generated_assets 
    (id, user_id, asset_type, format, prompt, file_url, thumbnail_url, metadata, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

export const updateAssetStatus = (db: Database.Database) =>
  db.prepare(`
    UPDATE ai_generated_assets 
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);

// Player Sessions
export const createSession = (db: Database.Database) =>
  db.prepare(`
    INSERT INTO player_sessions (id, game_id, player_id, session_start)
    VALUES (?, ?, ?, ?)
  `);

export const endSession = (db: Database.Database) =>
  db.prepare(`
    UPDATE player_sessions 
    SET session_end = ?, duration_seconds = ?
    WHERE id = ? AND session_end IS NULL
  `);

// ============ UTILITY FUNCTIONS ============

/**
 * Generate UUID-like ID
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parse JSON safely
 */
export function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Stringify JSON
 */
export function stringifyJson(data: unknown): string | null {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}
