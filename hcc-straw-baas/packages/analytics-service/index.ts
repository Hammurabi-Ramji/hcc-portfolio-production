import { Hono } from 'hono';
import { createServiceDB } from '../../shared/db/sqlite';
import { requireAuth, tenantOf } from '../../shared/utils/auth';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Every route needs a live auth-service session; the tenant comes from it.
app.use('*', requireAuth);

// Initialize SQLite database
const db = createServiceDB('analytics');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

/**
 * POST /events - Track event
 */
app.post('/events', async (c) => {
	const tenantId = tenantOf(c);
	const body = await c.req.json().catch(() => ({}));
	const {
		event_name,
		event_data,
		user_id,
		session_id,
		ip_address,
		user_agent,
	} = body;

	if (!event_name) {
		return c.json({ success: false, message: 'event_name required' }, 400);
	}

	try {
		const eventId = crypto.randomUUID();
		const eventDataJson = event_data ? JSON.stringify(event_data) : null;
		const clientIp = ip_address || c.req.header('CF-Connecting-IP') || 'unknown';
		const agent = user_agent || c.req.header('User-Agent') || 'unknown';

		db.prepare(
			`INSERT INTO events 
       (id, tenant_id, event_name, event_data_json, user_id, session_id, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			eventId,
			tenantId,
			event_name,
			eventDataJson,
			user_id || null,
			session_id || null,
			clientIp,
			agent
		);

		// Record metric if value provided
		if (event_data?.value !== undefined) {
			const metricId = crypto.randomUUID();
			db.prepare(
				`INSERT INTO metrics 
         (id, tenant_id, metric_name, metric_value, dimensions_json) 
         VALUES (?, ?, ?, ?, ?)`
			).run(
				metricId,
				tenantId,
				event_name,
				event_data.value,
				event_data.dimensions ? JSON.stringify(event_data.dimensions) : null
			);
		}

		return c.json({ success: true, event_id: eventId });
	} catch (error) {
		console.error('Event tracking error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /events - Query events
 */
app.get('/events', async (c) => {
	const tenantId = tenantOf(c);
	const eventName = c.req.query('event_name');
	const limit = parseInt(c.req.query('limit') || '100');
	const offset = parseInt(c.req.query('offset') || '0');
	const since = c.req.query('since');

	try {
		let query = 'SELECT * FROM events WHERE tenant_id = ?';
		const params: any[] = [tenantId];

		if (eventName) {
			query += ' AND event_name = ?';
			params.push(eventName);
		}

		if (since) {
			query += ' AND created_at >= ?';
			params.push(since);
		}

		query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
		params.push(limit, offset);

		const events = db.prepare(query).all(...params);

		const countResult = db
			.prepare(
				`SELECT COUNT(*) as count FROM events WHERE tenant_id = ? ${
					eventName ? 'AND event_name = ?' : ''
				}`
			)
			.get(
				...(eventName ? [tenantId, eventName] : [tenantId])
			) as { count: number };

		return c.json({
			success: true,
			events: events.map((e: any) => ({
				...e,
				event_data: e.event_data_json ? JSON.parse(e.event_data_json) : null,
			})),
			total: countResult.count,
		});
	} catch (error) {
		console.error('Event query error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /metrics - Query aggregated metrics
 */
app.get('/metrics', async (c) => {
	const tenantId = tenantOf(c);
	const metricName = c.req.query('metric_name');
	const since = c.req.query('since');

	try {
		let query = 'SELECT metric_name, COUNT(*) as count, AVG(metric_value) as avg_value, MIN(metric_value) as min_value, MAX(metric_value) as max_value, SUM(metric_value) as total FROM metrics WHERE tenant_id = ?';
		const params: any[] = [tenantId];

		if (metricName) {
			query += ' AND metric_name = ?';
			params.push(metricName);
		}

		if (since) {
			query += ' AND timestamp >= ?';
			params.push(since);
		}

		query += ' GROUP BY metric_name';

		const metrics = db.prepare(query).all(...params);

		return c.json({
			success: true,
			metrics,
		});
	} catch (error) {
		console.error('Metrics query error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /daily-aggregates - Get daily aggregated metrics
 */
app.get('/daily-aggregates', async (c) => {
	const tenantId = tenantOf(c);
	const metricName = c.req.query('metric_name');
	const days = parseInt(c.req.query('days') || '30');

	try {
		// Calculate aggregates for recent dates
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);
		const cutoffStr = cutoffDate.toISOString().split('T')[0];

		// Query existing aggregates
		let query = 'SELECT * FROM daily_aggregates WHERE tenant_id = ? AND date >= ?';
		const params: any[] = [tenantId, cutoffStr];

		if (metricName) {
			query += ' AND metric_name = ?';
			params.push(metricName);
		}

		query += ' ORDER BY date DESC';

		const aggregates = db.prepare(query).all(...params);

		return c.json({
			success: true,
			aggregates,
			period_days: days,
		});
	} catch (error) {
		console.error('Aggregates query error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * POST /aggregates/compute - Compute daily aggregates (background job)
 */
app.post('/aggregates/compute', async (c) => {
	const tenantId = tenantOf(c);

	try {
		const today = new Date().toISOString().split('T')[0];

		// Get all unique metrics for today
		const metricsResult = db
			.prepare(
				`SELECT DISTINCT metric_name FROM metrics WHERE tenant_id = ? AND DATE(timestamp) = ?`
			)
			.all(tenantId, today) as Array<{ metric_name: string }>;

		let computed = 0;

		for (const { metric_name } of metricsResult) {
			const stats = db
				.prepare(
					`SELECT COUNT(*) as count, AVG(metric_value) as avg, MIN(metric_value) as min, MAX(metric_value) as max, SUM(metric_value) as sum FROM metrics WHERE tenant_id = ? AND metric_name = ? AND DATE(timestamp) = ?`
				)
				.get(tenantId, metric_name, today) as any;

			const aggregateId = crypto.randomUUID();
			db.prepare(
				`INSERT OR REPLACE INTO daily_aggregates (id, tenant_id, metric_name, date, count, sum, avg, min, max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			).run(
				aggregateId,
				tenantId,
				metric_name,
				today,
				stats.count,
				stats.sum,
				stats.avg,
				stats.min,
				stats.max
			);

			computed++;
		}

		return c.json({
			success: true,
			message: `Computed aggregates for ${computed} metrics`,
		});
	} catch (error) {
		console.error('Aggregate computation error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /health - Service health check with stats
 */
app.get('/health', async (c) => {
	const tenantId = tenantOf(c);

	try {
		const eventCount = db
			.prepare('SELECT COUNT(*) as count FROM events WHERE tenant_id = ?')
			.get(tenantId) as { count: number };

		const metricCount = db
			.prepare('SELECT COUNT(*) as count FROM metrics WHERE tenant_id = ?')
			.get(tenantId) as { count: number };

		return c.json({
			success: true,
			status: 'healthy',
			events_tracked: eventCount.count,
			metrics_recorded: metricCount.count,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				status: 'unhealthy',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

export default app;
