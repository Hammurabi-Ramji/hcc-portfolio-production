import { Hono } from 'hono';
import { createServiceDB } from '../../shared/db/sqlite';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Initialize SQLite database
const db = createServiceDB('data');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

/**
 * POST /collections - Create a new collection
 */
app.post('/collections', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const body = await c.req.json().catch(() => ({}));
	const { name, schema } = body;

	if (!name) {
		return c.json({ success: false, message: 'Collection name required' }, 400);
	}

	try {
		const collectionId = crypto.randomUUID();
		const schemaJson = schema ? JSON.stringify(schema) : null;

		db.prepare(
			'INSERT INTO collections (id, tenant_id, name, schema_json) VALUES (?, ?, ?, ?)'
		).run(collectionId, tenantId, name, schemaJson);

		return c.json({
			success: true,
			collection: { id: collectionId, name, tenant_id: tenantId },
		});
	} catch (error) {
		console.error('Collection creation error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /collections - List collections for tenant
 */
app.get('/collections', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';

	try {
		const collections = db
			.prepare('SELECT id, name, schema_json, created_at FROM collections WHERE tenant_id = ?')
			.all(tenantId);

		return c.json({
			success: true,
			collections: collections.map((col: any) => ({
				...col,
				schema: col.schema_json ? JSON.parse(col.schema_json) : null,
			})),
		});
	} catch (error) {
		console.error('Fetch collections error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * POST /records - Insert record into collection
 */
app.post('/records', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const body = await c.req.json().catch(() => ({}));
	const { collection_id, data } = body;

	if (!collection_id || !data) {
		return c.json(
			{ success: false, message: 'collection_id and data required' },
			400
		);
	}

	try {
		// Verify collection belongs to tenant
		const collection = db
			.prepare('SELECT id FROM collections WHERE id = ? AND tenant_id = ?')
			.get(collection_id, tenantId);

		if (!collection) {
			return c.json({ success: false, message: 'Collection not found' }, 404);
		}

		const recordId = crypto.randomUUID();
		const dataJson = JSON.stringify(data);

		db.prepare(
			'INSERT INTO records (id, tenant_id, collection_id, data_json) VALUES (?, ?, ?, ?)'
		).run(recordId, tenantId, collection_id, dataJson);

		return c.json({
			success: true,
			record: { id: recordId, collection_id, data, created_at: new Date().toISOString() },
		});
	} catch (error) {
		console.error('Record insertion error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /records - Query records from collection
 */
app.get('/records', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const collectionId = c.req.query('collection_id');
	const limit = parseInt(c.req.query('limit') || '100');
	const offset = parseInt(c.req.query('offset') || '0');

	if (!collectionId) {
		return c.json({ success: false, message: 'collection_id query param required' }, 400);
	}

	try {
		const records = db
			.prepare(
				'SELECT id, data_json, created_at FROM records WHERE tenant_id = ? AND collection_id = ? LIMIT ? OFFSET ?'
			)
			.all(tenantId, collectionId, limit, offset);

		const countResult = db
			.prepare(
				'SELECT COUNT(*) as count FROM records WHERE tenant_id = ? AND collection_id = ?'
			)
			.get(tenantId, collectionId) as { count: number };

		return c.json({
			success: true,
			records: records.map((r: any) => ({
				id: r.id,
				data: JSON.parse(r.data_json),
				created_at: r.created_at,
			})),
			total: countResult.count,
			limit,
			offset,
		});
	} catch (error) {
		console.error('Query error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /records/:id - Get specific record
 */
app.get('/records/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const recordId = c.req.param('id');

	try {
		const record = db
			.prepare('SELECT * FROM records WHERE id = ? AND tenant_id = ?')
			.get(recordId, tenantId);

		if (!record) {
			return c.json({ success: false, message: 'Record not found' }, 404);
		}

		return c.json({
			success: true,
			record: {
				id: record.id,
				collection_id: record.collection_id,
				data: JSON.parse(record.data_json),
				created_at: record.created_at,
				updated_at: record.updated_at,
			},
		});
	} catch (error) {
		console.error('Fetch record error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * PUT /records/:id - Update record
 */
app.put('/records/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const recordId = c.req.param('id');
	const body = await c.req.json().catch(() => ({}));
	const { data } = body;

	if (!data) {
		return c.json({ success: false, message: 'data field required' }, 400);
	}

	try {
		const record = db
			.prepare('SELECT * FROM records WHERE id = ? AND tenant_id = ?')
			.get(recordId, tenantId);

		if (!record) {
			return c.json({ success: false, message: 'Record not found' }, 404);
		}

		const dataJson = JSON.stringify(data);
		const now = new Date().toISOString();

		db.prepare('UPDATE records SET data_json = ?, updated_at = ? WHERE id = ?').run(
			dataJson,
			now,
			recordId
		);

		return c.json({
			success: true,
			record: { id: recordId, data, updated_at: now },
		});
	} catch (error) {
		console.error('Update error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * DELETE /records/:id - Delete record
 */
app.delete('/records/:id', async (c) => {
	const tenantId = c.req.header('X-Tenant-ID') || 'default';
	const recordId = c.req.param('id');

	try {
		const record = db
			.prepare('SELECT * FROM records WHERE id = ? AND tenant_id = ?')
			.get(recordId, tenantId);

		if (!record) {
			return c.json({ success: false, message: 'Record not found' }, 404);
		}

		db.prepare('DELETE FROM records WHERE id = ?').run(recordId);

		return c.json({ success: true, message: 'Record deleted' });
	} catch (error) {
		console.error('Delete error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

export default app;
