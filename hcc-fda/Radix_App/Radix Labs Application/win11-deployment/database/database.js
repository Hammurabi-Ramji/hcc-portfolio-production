// Database Configuration Module for Radix Labs ERP
// ====================================================
// Production-grade database configuration with connection pooling,
// error handling, and monitoring

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../src/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection pool configuration
const DATABASE_CONFIG = {
  development: {
    filename: path.join(__dirname, "../database.sqlite"),
    driver: sqlite3.Database,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || 1),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || 5),
    connectionTimeout: parseInt(
      process.env.DATABASE_CONNECTION_TIMEOUT || 10000
    ),
    enableLogs: process.env.DATABASE_ENABLE_LOGS === "true",
  },
  production: {
    filename:
      process.env.DATABASE_URL?.replace("sqlite://", "") ||
      "/data/database.sqlite",
    driver: sqlite3.Database,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || 1),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || 10),
    connectionTimeout: parseInt(
      process.env.DATABASE_CONNECTION_TIMEOUT || 10000
    ),
    enableLogs: false,
  },
  test: {
    filename: ":memory:",
    driver: sqlite3.Database,
    poolMin: 1,
    poolMax: 1,
    connectionTimeout: 5000,
    enableLogs: false,
  },
};

let dbInstance = null;
const env = process.env.NODE_ENV || "development";
const config = DATABASE_CONFIG[env] || DATABASE_CONFIG.development;

/**
 * Get or initialize database connection
 * @returns {Promise<Database>} SQLite database instance with connection pool
 */
export async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    logger.info(`Initializing ${env} database: ${config.filename}`);

    dbInstance = await open({
      filename: config.filename,
      driver: config.driver,
    });

    // Enable foreign keys
    await dbInstance.exec("PRAGMA foreign_keys = ON;");

    // Set journal mode for better concurrency
    await dbInstance.exec("PRAGMA journal_mode = WAL;");

    // Set synchronous mode for performance
    await dbInstance.exec("PRAGMA synchronous = NORMAL;");

    // Set cache size
    await dbInstance.exec("PRAGMA cache_size = -64000;");

    // Enable query timeout
    await dbInstance.exec(`PRAGMA query_only = OFF;`);

    logger.info("Database connection established successfully");
    return dbInstance;
  } catch (error) {
    logger.error("Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (dbInstance) {
    try {
      await dbInstance.close();
      dbInstance = null;
      logger.info("Database connection closed");
    } catch (error) {
      logger.error("Error closing database:", error);
    }
  }
}

/**
 * Execute database migration
 * @param {string} migrationName - Name of the migration
 * @param {Function} migrationFn - Migration function
 */
export async function runMigration(migrationName, migrationFn) {
  const db = await getDatabase();

  try {
    logger.info(`Running migration: ${migrationName}`);
    await migrationFn(db);
    logger.info(`Migration completed: ${migrationName}`);
  } catch (error) {
    logger.error(`Migration failed: ${migrationName}`, error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const db = await getDatabase();

  try {
    const stats = await db.all(`
      SELECT 
        page_count * page_size as size,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='index') as index_count
      FROM pragma_page_count(), pragma_page_size();
    `);

    return (
      stats[0] || {
        size: 0,
        table_count: 0,
        index_count: 0,
      }
    );
  } catch (error) {
    logger.error("Failed to get database stats:", error);
    return null;
  }
}

/**
 * Health check for database
 */
export async function healthCheck() {
  try {
    const db = await getDatabase();
    await db.exec("SELECT 1;");
    return { status: "ok", database: "sqlite" };
  } catch (error) {
    logger.error("Database health check failed:", error);
    return { status: "error", database: "sqlite", error: error.message };
  }
}

export default {
  getDatabase,
  closeDatabase,
  runMigration,
  getDatabaseStats,
  healthCheck,
  config,
};
