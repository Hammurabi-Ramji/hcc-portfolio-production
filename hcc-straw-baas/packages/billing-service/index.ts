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
const db = createServiceDB('billing');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

// Pricing configuration (base + usage rate)
const PLAN_PRICING: Record<string, { baseMonthly: number; ratePerUnit: number }> = {
	free: { baseMonthly: 0, ratePerUnit: 0 },
	pro: { baseMonthly: 29.99, ratePerUnit: 0.05 },
	enterprise: { baseMonthly: 299.99, ratePerUnit: 0.02 },
};

/**
 * POST /subscriptions - Create or update subscription
 */
app.post('/subscriptions', async (c) => {
	const tenantId = tenantOf(c);
	const body = await c.req.json().catch(() => ({}));
	const { plan } = body;

	if (!plan || !PLAN_PRICING[plan]) {
		return c.json({ success: false, message: 'Valid plan required' }, 400);
	}

	try {
		// Check existing subscription
		const existing = db
			.prepare('SELECT id FROM subscriptions WHERE tenant_id = ?')
			.get(tenantId);

		const now = new Date();
		const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
		const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

		if (existing) {
			db.prepare('UPDATE subscriptions SET plan = ?, status = ? WHERE tenant_id = ?').run(
				plan,
				'active',
				tenantId
			);
		} else {
			const subscriptionId = crypto.randomUUID();
			db.prepare(
				'INSERT INTO subscriptions (id, tenant_id, plan, billing_cycle_start, billing_cycle_end) VALUES (?, ?, ?, ?, ?)'
			).run(subscriptionId, tenantId, plan, cycleStart, cycleEnd);
		}

		return c.json({
			success: true,
			subscription: { tenant_id: tenantId, plan, status: 'active' },
		});
	} catch (error) {
		console.error('Subscription error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /subscriptions/:tenantId - Get subscription details
 */
app.get('/subscriptions/:tenantId', async (c) => {
	const tenantId = c.req.param('tenantId');
	if (tenantId !== tenantOf(c)) {
		return c.json({ success: false, message: 'Forbidden' }, 403);
	}

	try {
		const subscription = db
			.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?')
			.get(tenantId);

		if (!subscription) {
			return c.json({ success: false, message: 'No subscription found' }, 404);
		}

		return c.json({
			success: true,
			subscription,
		});
	} catch (error) {
		console.error('Fetch subscription error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * POST /usage/record - Record usage metric
 */
app.post('/usage/record', async (c) => {
	const tenantId = tenantOf(c);
	const body = await c.req.json().catch(() => ({}));
	const { metric_name, value } = body;

	if (!metric_name || value === undefined) {
		return c.json(
			{ success: false, message: 'metric_name and value required' },
			400
		);
	}

	try {
		const usageId = crypto.randomUUID();
		db.prepare(
			'INSERT INTO usage_records (id, tenant_id, metric_name, value) VALUES (?, ?, ?, ?)'
		).run(usageId, tenantId, metric_name, value);

		return c.json({ success: true, usage_id: usageId });
	} catch (error) {
		console.error('Usage record error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /usage/:tenantId - Get current usage
 */
app.get('/usage/:tenantId', async (c) => {
	const tenantId = c.req.param('tenantId');
	if (tenantId !== tenantOf(c)) {
		return c.json({ success: false, message: 'Forbidden' }, 403);
	}

	try {
		const subscription = db
			.prepare('SELECT plan, billing_cycle_start FROM subscriptions WHERE tenant_id = ?')
			.get(tenantId);

		if (!subscription) {
			return c.json({ success: false, message: 'No subscription found' }, 404);
		}

		// Sum usage since billing cycle start
		const usageData = db
			.prepare(
				`SELECT SUM(value) as total_usage FROM usage_records 
       WHERE tenant_id = ? AND created_at >= ?`
			)
			.get(tenantId, subscription.billing_cycle_start) as { total_usage: number | null };

		const totalUsage = usageData.total_usage || 0;
		const pricing = PLAN_PRICING[subscription.plan];

		return c.json({
			success: true,
			tenant_id: tenantId,
			plan: subscription.plan,
			usage: totalUsage,
			base_cost: pricing.baseMonthly,
			usage_cost: (totalUsage * pricing.ratePerUnit).toFixed(2),
			estimated_total: (pricing.baseMonthly + totalUsage * pricing.ratePerUnit).toFixed(2),
		});
	} catch (error) {
		console.error('Usage fetch error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * POST /invoices/generate - Generate invoice for billing cycle
 */
app.post('/invoices/generate', async (c) => {
	// Invoices are only generated for the caller's own tenant; body.tenant_id is ignored.
	const tenantId = tenantOf(c);

	try {
		const subscription = db
			.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?')
			.get(tenantId);

		if (!subscription) {
			return c.json({ success: false, message: 'No subscription found' }, 404);
		}

		// Calculate usage for this cycle
		const usageData = db
			.prepare(
				`SELECT SUM(value) as total_usage FROM usage_records 
       WHERE tenant_id = ? AND created_at >= ?`
			)
			.get(tenantId, subscription.billing_cycle_start) as { total_usage: number | null };

		const totalUsage = usageData.total_usage || 0;
		const pricing = PLAN_PRICING[subscription.plan];
		const amount =
			pricing.baseMonthly + totalUsage * pricing.ratePerUnit;

		const invoiceId = crypto.randomUUID();
		const issuedAt = new Date().toISOString();
		const dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		db.prepare(
			`INSERT INTO invoices 
       (id, tenant_id, subscription_id, amount, issued_at, due_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		).run(
			invoiceId,
			tenantId,
			subscription.id,
			amount.toFixed(2),
			issuedAt,
			dueAt,
			'issued'
		);

		return c.json({
			success: true,
			invoice: {
				id: invoiceId,
				tenant_id: tenantId,
				amount: amount.toFixed(2),
				currency: 'USD',
				status: 'issued',
				issued_at: issuedAt,
				due_at: dueAt,
			},
		});
	} catch (error) {
		console.error('Invoice generation error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /invoices - List invoices for tenant
 */
app.get('/invoices', async (c) => {
	const tenantId = tenantOf(c);
	const status = c.req.query('status');

	try {
		let query = 'SELECT * FROM invoices WHERE tenant_id = ?';
		const params: any[] = [tenantId];

		if (status) {
			query += ' AND status = ?';
			params.push(status);
		}

		query += ' ORDER BY issued_at DESC LIMIT 100';

		const invoices = db.prepare(query).all(...params);

		return c.json({
			success: true,
			invoices,
		});
	} catch (error) {
		console.error('Invoice list error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

export default app;
