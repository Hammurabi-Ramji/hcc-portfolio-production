import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { createServiceDB } from '../../shared/db/sqlite';
import { globalCache } from '../../shared/db/cache';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'hcc-straw-baas-secret';

// Initialize SQLite database
const db = createServiceDB('auth');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

// Utility: Hash password (in production, use bcrypt)
function hashPassword(password: string): string {
	return crypto.createHash('sha256').update(password).digest('hex');
}

// Utility: Create or get tenant
function getOrCreateTenant(tenantId: string, tenantName: string): void {
	const existingTenant = db.prepare('SELECT id FROM tenants WHERE id = ?').get(tenantId);
	if (!existingTenant) {
		db.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)').run(tenantId, tenantName);
	}
}

/**
 * POST /login - Authenticate user and return JWT
 */
app.post('/login', async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { email, password, tenant_id } = body;

	if (!email || !password || !tenant_id) {
		return c.json(
			{ success: false, message: 'Email, password, and tenant_id required' },
			400
		);
	}

	try {
		const user = db
			.prepare('SELECT * FROM users WHERE email = ? AND tenant_id = ?')
			.get(email, tenant_id);

		if (!user || user.password_hash !== hashPassword(password)) {
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}

		if (user.status !== 'active') {
			return c.json({ success: false, message: 'User account inactive' }, 403);
		}

		const token = await sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				tenant_id: user.tenant_id,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
			},
			JWT_SECRET
		);

		// Create session record
		const sessionId = crypto.randomUUID();
		const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

		db.prepare(
			'INSERT INTO sessions (id, user_id, tenant_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
		).run(sessionId, user.id, user.tenant_id, tokenHash, expiresAt);

		// Cache token briefly
		globalCache.set(`session:${sessionId}`, { userId: user.id, tenantId: user.tenant_id });

		return c.json({
			success: true,
			token,
			user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
		});
	} catch (error) {
		console.error('Login error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * POST /register - Register new user
 */
app.post('/register', async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { email, password, tenant_id, tenant_name } = body;

	if (!email || !password || !tenant_id) {
		return c.json(
			{ success: false, message: 'Email, password, and tenant_id required' },
			400
		);
	}

	try {
		// Ensure tenant exists
		getOrCreateTenant(tenant_id, tenant_name || `Tenant ${tenant_id}`);

		// Check if user exists
		const existingUser = db
			.prepare('SELECT id FROM users WHERE email = ? AND tenant_id = ?')
			.get(email, tenant_id);

		if (existingUser) {
			return c.json({ success: false, message: 'User already exists' }, 409);
		}

		const userId = crypto.randomUUID();
		const passwordHash = hashPassword(password);

		db.prepare(
			'INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
		).run(userId, tenant_id, email, passwordHash, 'user');

		return c.json({
			success: true,
			message: 'User registered successfully',
			user: { id: userId, email, tenant_id },
		});
	} catch (error) {
		console.error('Registration error:', error);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
});

/**
 * GET /me - Get current user from JWT
 */
app.get('/me', async (c) => {
	const authHeader = c.req.header('Authorization');
	if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

	const token = authHeader.replace('Bearer ', '');
	try {
		const payload = await verify(token, JWT_SECRET);
		return c.json({ success: true, user: payload });
	} catch (e) {
		return c.json({ error: 'Invalid token' }, 401);
	}
});

/**
 * POST /logout - Invalidate session
 */
app.post('/logout', async (c) => {
	const authHeader = c.req.header('Authorization');
	if (!authHeader) return c.json({ success: false }, 401);

	const token = authHeader.replace('Bearer ', '');
	try {
		const payload = await verify(token, JWT_SECRET);
		globalCache.delete(`session:${payload.id}`);
		return c.json({ success: true, message: 'Logged out' });
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
});

export default app;
