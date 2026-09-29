import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Local File Storage Service (replaces MinIO)
 * Stores files in local filesystem with metadata in SQLite
 */
export class FileStorage {
	private storagePath: string;

	constructor(storagePath: string = '.storage') {
		this.storagePath = storagePath;
		if (!fs.existsSync(storagePath)) {
			fs.mkdirSync(storagePath, { recursive: true });
		}
	}

	/**
	 * Store file in tenant-isolated directory
	 */
	async storeFile(
		tenantId: string,
		fileName: string,
		fileBuffer: Buffer
	): Promise<{ fileId: string; path: string }> {
		const fileId = crypto.randomBytes(8).toString('hex');
		const tenantDir = path.join(this.storagePath, tenantId);

		// Create tenant directory if needed
		if (!fs.existsSync(tenantDir)) {
			fs.mkdirSync(tenantDir, { recursive: true });
		}

		const filePath = path.join(tenantDir, `${fileId}-${fileName}`);
		fs.writeFileSync(filePath, fileBuffer);

		return {
			fileId,
			path: filePath,
		};
	}

	/**
	 * Retrieve file from storage
	 */
	getFile(tenantId: string, fileId: string): Buffer | null {
		const tenantDir = path.join(this.storagePath, tenantId);
		const files = fs.readdirSync(tenantDir || '.');

		const file = files.find((f) => f.startsWith(fileId));
		if (!file) return null;

		const filePath = path.join(tenantDir, file);
		return fs.readFileSync(filePath);
	}

	/**
	 * List files for tenant
	 */
	listFiles(tenantId: string): string[] {
		const tenantDir = path.join(this.storagePath, tenantId);
		if (!fs.existsSync(tenantDir)) return [];
		return fs.readdirSync(tenantDir);
	}

	/**
	 * Delete file
	 */
	deleteFile(tenantId: string, fileId: string): boolean {
		const tenantDir = path.join(this.storagePath, tenantId);
		const files = fs.readdirSync(tenantDir || '.');

		const file = files.find((f) => f.startsWith(fileId));
		if (!file) return false;

		fs.unlinkSync(path.join(tenantDir, file));
		return true;
	}

	/**
	 * Get storage stats
	 */
	getStats(tenantId: string): { fileCount: number; totalSize: number } {
		const tenantDir = path.join(this.storagePath, tenantId);
		if (!fs.existsSync(tenantDir)) return { fileCount: 0, totalSize: 0 };

		const files = fs.readdirSync(tenantDir);
		let totalSize = 0;

		files.forEach((file) => {
			const filePath = path.join(tenantDir, file);
			const stat = fs.statSync(filePath);
			totalSize += stat.size;
		});

		return { fileCount: files.length, totalSize };
	}
}

export const fileStorage = new FileStorage();
