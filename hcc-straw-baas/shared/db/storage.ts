import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TENANT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const FILE_ID_PATTERN = /^[0-9a-f]{16}$/;
const MAX_NAME_LENGTH = 128;

/**
 * Reduce a client-supplied file name to one safe path segment. Directory parts,
 * `..`, separators and control characters never reach the filesystem.
 */
export function safeFileName(name: string): string {
	const base = path.basename(String(name ?? '').replace(/\\/g, '/'));
	const cleaned = base
		.replace(/[\u0000-\u001f\u007f]/g, '')
		.replace(/[^A-Za-z0-9._-]/g, '_')
		.replace(/^\.+/, '')
		.slice(0, MAX_NAME_LENGTH);
	return cleaned || 'file';
}

/**
 * Local File Storage Service (replaces MinIO)
 * Stores files in local filesystem with metadata in SQLite
 */
export class FileStorage {
	private storagePath: string;

	constructor(storagePath: string = '.storage') {
		this.storagePath = path.resolve(storagePath);
		if (!fs.existsSync(this.storagePath)) {
			fs.mkdirSync(this.storagePath, { recursive: true });
		}
	}

	/** Tenant directory, guaranteed to sit directly under the storage root. */
	private tenantDir(tenantId: string): string {
		if (!TENANT_ID_PATTERN.test(tenantId)) {
			throw new Error('Invalid tenant id');
		}
		return this.contained(path.join(this.storagePath, tenantId));
	}

	private contained(target: string): string {
		const resolved = path.resolve(target);
		if (!resolved.startsWith(this.storagePath + path.sep)) {
			throw new Error('Path escapes storage root');
		}
		return resolved;
	}

	private findFile(tenantDir: string, fileId: string): string | null {
		if (!FILE_ID_PATTERN.test(fileId) || !fs.existsSync(tenantDir)) return null;
		const file = fs.readdirSync(tenantDir).find((f) => f.startsWith(`${fileId}-`));
		return file ? this.contained(path.join(tenantDir, file)) : null;
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
		const tenantDir = this.tenantDir(tenantId);

		// Create tenant directory if needed
		if (!fs.existsSync(tenantDir)) {
			fs.mkdirSync(tenantDir, { recursive: true });
		}

		const filePath = this.contained(path.join(tenantDir, `${fileId}-${safeFileName(fileName)}`));
		fs.writeFileSync(filePath, fileBuffer, { flag: 'wx' });

		return {
			fileId,
			path: filePath,
		};
	}

	/**
	 * Retrieve file from storage
	 */
	getFile(tenantId: string, fileId: string): Buffer | null {
		const filePath = this.findFile(this.tenantDir(tenantId), fileId);
		return filePath ? fs.readFileSync(filePath) : null;
	}

	/**
	 * List files for tenant
	 */
	listFiles(tenantId: string): string[] {
		const tenantDir = this.tenantDir(tenantId);
		if (!fs.existsSync(tenantDir)) return [];
		return fs.readdirSync(tenantDir);
	}

	/**
	 * Delete file
	 */
	deleteFile(tenantId: string, fileId: string): boolean {
		const filePath = this.findFile(this.tenantDir(tenantId), fileId);
		if (!filePath) return false;
		fs.unlinkSync(filePath);
		return true;
	}

	/**
	 * Get storage stats
	 */
	getStats(tenantId: string): { fileCount: number; totalSize: number } {
		const tenantDir = this.tenantDir(tenantId);
		if (!fs.existsSync(tenantDir)) return { fileCount: 0, totalSize: 0 };

		const files = fs.readdirSync(tenantDir);
		let totalSize = 0;

		files.forEach((file) => {
			const stat = fs.statSync(this.contained(path.join(tenantDir, file)));
			totalSize += stat.size;
		});

		return { fileCount: files.length, totalSize };
	}
}

export const fileStorage = new FileStorage();
