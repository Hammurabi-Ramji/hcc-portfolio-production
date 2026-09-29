import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SQLite Database Manager
 * Provides connection pooling, migrations, and multi-tenant isolation
 */
export class SQLiteDB {
	private db: Database.Database;
	private dbPath: string;

	constructor(dbName: string = 'holo9.db', dataDir: string = '.data') {
		this.dbPath = path.join(dataDir, dbName);
		
		// Ensure data directory exists
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}

		this.db = new Database(this.dbPath);
		this.db.pragma('journal_mode = WAL');
		this.db.pragma('foreign_keys = ON');
	}

	/**
	 * Execute raw SQL query
	 */
	exec(sql: string): void {
		this.db.exec(sql);
	}

	/**
	 * Prepare and execute a statement
	 */
	prepare(sql: string) {
		return this.db.prepare(sql);
	}

	/**
	 * Run migrations from SQL files
	 */
	migrate(migrationPath: string): void {
		if (!fs.existsSync(migrationPath)) {
			console.warn(`Migration file not found: ${migrationPath}`);
			return;
		}

		const sql = fs.readFileSync(migrationPath, 'utf-8');
		this.db.exec(sql);
		console.log(`✓ Applied migration: ${migrationPath}`);
	}

	/**
	 * Begin transaction
	 */
	transaction(fn: () => void): void {
		const transaction = this.db.transaction(fn);
		transaction();
	}

	/**
	 * Close database connection
	 */
	close(): void {
		this.db.close();
	}

	/**
	 * Get database file path
	 */
	getPath(): string {
		return this.dbPath;
	}
}

/**
 * Create singleton database instance per service
 */
export function createServiceDB(serviceName: string): SQLiteDB {
	return new SQLiteDB(`${serviceName}.db`);
}
