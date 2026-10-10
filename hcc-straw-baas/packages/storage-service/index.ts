import { Hono } from 'hono';
import { createServiceDB } from '../../shared/db/sqlite';
import { fileStorage } from '../../shared/db/storage';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Initialize SQLite database
const db = createServiceDB('storage');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

/**
 * POST /upload - Upload file to local storage
 */
app.post('/upload', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';

	try {
		const body = await c.req.parseBody();
		const file = body.file as File;

		if (!file) {
			return c.json(
				{ success: false, message: 'File required in multipart request' },
				400
			);
		}

		// Read file buffer
		const buffer = Buffer.from(await file.arrayBuffer());
		const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

		// Store file
		const { fileId, path: storagePath } = await fileStorage.storeFile(
			tenantId,
			file.name,
			buffer
		);

		// Record in database
		const fileEntry = {
			id: fileId,
			tenant_id: tenantId,
			name: file.name,
			size: file.size,
			mime_type: file.type,
			file_hash: fileHash,
			storage_path: storagePath,
			status: 'active',
		};

		db.prepare(
			`INSERT INTO file_entries 
       (id, tenant_id, name, size, mime_type, file_hash, storage_path, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			fileEntry.id,
			fileEntry.tenant_id,
			fileEntry.name,
			fileEntry.size,
			fileEntry.mime_type,
			fileEntry.file_hash,
			fileEntry.storage_path,
			fileEntry.status
		);

		// Update quota
		const stats = fileStorage.getStats(tenantId);
		const quota = db.prepare('SELECT * FROM quota_limits WHERE tenant_id = ?').get(tenantId);

		if (quota) {
			db.prepare(
				'UPDATE quota_limits SET used_bytes = ?, file_count = ? WHERE tenant_id = ?'
			).run(stats.totalSize, stats.fileCount, tenantId);
		} else {
			db.prepare(
				'INSERT INTO quota_limits (tenant_id, used_bytes, file_count) VALUES (?, ?, ?)'
			).run(tenantId, stats.totalSize, stats.fileCount);
		}

		return c.json({
			success: true,
			file: {
				id: fileId,
				name: file.name,
				size: file.size,
				mime_type: file.type,
				url: `/files/${fileId}`,
			},
		});
	} catch (error) {
		console.error('Upload error:', error);
		return c.json({ success: false, message: 'Upload failed' }, 500);
	}
});

/**
 * GET /files/:id - Download file
 */
app.get('/files/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const fileId = c.req.param('id');

	try {
		const fileEntry = db
			.prepare('SELECT * FROM file_entries WHERE id = ? AND tenant_id = ?')
			.get(fileId, tenantId);

		if (!fileEntry) {
			return c.json({ success: false, message: 'File not found' }, 404);
		}

		const fileBuffer = fileStorage.getFile(tenantId, fileId);
		if (!fileBuffer) {
			return c.json({ success: false, message: 'File not found in storage' }, 404);
		}

		// Log access
		const logId = crypto.randomUUID();
		db.prepare(
			'INSERT INTO file_access_logs (id, file_id, tenant_id, access_type) VALUES (?, ?, ?, ?)'
		).run(logId, fileId, tenantId, 'download');

		// Return file
		c.header('Content-Type', fileEntry.mime_type || 'application/octet-stream');
		c.header(
			'Content-Disposition',
			`attachment; filename="${fileEntry.name}"`
		);

		return c.body(fileBuffer);
	} catch (error) {
		console.error('Download error:', error);
		return c.json({ success: false, message: 'Download failed' }, 500);
	}
});

/**
 * GET /files-metadata/:id - Get file metadata
 */
app.get('/files-metadata/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const fileId = c.req.param('id');

	try {
		const fileEntry = db
			.prepare('SELECT * FROM file_entries WHERE id = ? AND tenant_id = ?')
			.get(fileId, tenantId);

		if (!fileEntry) {
			return c.json({ success: false, message: 'File not found' }, 404);
		}

		return c.json({
			success: true,
			file: {
				id: fileEntry.id,
				name: fileEntry.name,
				size: fileEntry.size,
				mime_type: fileEntry.mime_type,
				created_at: fileEntry.created_at,
				status: fileEntry.status,
			},
		});
	} catch (error) {
		console.error('Metadata fetch error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /files - List files for tenant
 */
app.get('/files', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';

	try {
		const files = db
			.prepare('SELECT id, name, size, mime_type, created_at FROM file_entries WHERE tenant_id = ? ORDER BY created_at DESC')
			.all(tenantId);

		return c.json({
			success: true,
			files,
		});
	} catch (error) {
		console.error('List files error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * DELETE /files/:id - Delete file
 */
app.delete('/files/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const fileId = c.req.param('id');

	try {
		const fileEntry = db
			.prepare('SELECT * FROM file_entries WHERE id = ? AND tenant_id = ?')
			.get(fileId, tenantId);

		if (!fileEntry) {
			return c.json({ success: false, message: 'File not found' }, 404);
		}

		// Delete from filesystem
		fileStorage.deleteFile(tenantId, fileId);

		// Mark as deleted in database
		db.prepare('UPDATE file_entries SET status = ? WHERE id = ?').run('deleted', fileId);

		// Update quota
		const stats = fileStorage.getStats(tenantId);
		db.prepare(
			'UPDATE quota_limits SET used_bytes = ?, file_count = ? WHERE tenant_id = ?'
		).run(stats.totalSize, stats.fileCount, tenantId);

		return c.json({ success: true, message: 'File deleted' });
	} catch (error) {
		console.error('Delete error:', error);
		return c.json({ success: false, message: 'Delete failed' }, 500);
	}
});

/**
 * GET /quota - Get storage quota info
 */
app.get('/quota', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';

	try {
		const quota = db
			.prepare('SELECT * FROM quota_limits WHERE tenant_id = ?')
			.get(tenantId);

		if (!quota) {
			return c.json({ success: false, message: 'Quota not found' }, 404);
		}

		const usedPercent = ((quota.used_bytes / quota.max_storage_bytes) * 100).toFixed(2);

		return c.json({
			success: true,
			quota: {
				max_bytes: quota.max_storage_bytes,
				used_bytes: quota.used_bytes,
				available_bytes: quota.max_storage_bytes - quota.used_bytes,
				file_count: quota.file_count,
				used_percent: usedPercent,
			},
		});
	} catch (error) {
		console.error('Quota fetch error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

export default app;
