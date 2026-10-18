import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { createServiceDB } from '../../shared/db/sqlite';
import { globalCache } from '../../shared/db/cache';
import {
	TENANT_ID_PATTERN,
	authenticate,
	hashPassword,
	hashToken,
	jwtSecret,
	needsRehash,
	verifyPassword,
} from '../../shared/utils/auth';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();
// Fails at startup when JWT_SECRET is missing or weak; there is no default.
const JWT_SECRET = jwtSecret();
const MIN_PASSWORD_LENGTH = 12;

// Initialize SQLite database
const db = createServiceDB('auth');

// Run migrations on startup
db.migrate(path.join(__dirname, 'migrations/001-init.sql'));

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

		if (!user || !verifyPassword(String(password), user.password_hash)) {
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}

		if (user.status !== 'active') {
			return c.json({ success: false, message: 'User account inactive' }, 403);
		}

		// Upgrade legacy unsalted hashes on the first successful login.
		if (needsRehash(user.password_hash)) {
			db.prepare(
				'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
			).run(hashPassword(String(password)), user.id);
		}

		const token = await sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				tenant_id: user.tenant_id,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
				jti: crypto.randomUUID(),
			},
			JWT_SECRET,
			'HS256'
		);

		// Create session record; every service checks this row, not just the signature.
		const sessionId = crypto.randomUUID();
		const tokenHash = hashToken(token);
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
 * POST /register - Register a new tenant and its first user
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
	if (typeof tenant_id !== 'string' || !TENANT_ID_PATTERN.test(tenant_id)) {
		return c.json(
			{ success: false, message: 'tenant_id must be 1-64 letters, digits, _ or -' },
			400
		);
	}
	if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
		return c.json(
			{ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
			400
		);
	}

	try {
		const userId = crypto.randomUUID();
		const passwordHash = hashPassword(password);

		// Public registration can only create a new tenant. Joining an existing
		// tenant needs an invitation flow, which does not exist yet; allowing it
		// would let anyone read that tenant's data.
		let outcome: 'created' | 'tenant_exists' | 'user_exists' = 'created';
		db.transaction(() => {
			if (db.prepare('SELECT id FROM tenants WHERE id = ?').get(tenant_id)) {
				outcome = 'tenant_exists';
				return;
			}
			if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
				outcome = 'user_exists';
				return;
			}
			db.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)').run(
				tenant_id,
				tenant_name || `Tenant ${tenant_id}`
			);
			db.prepare(
				'INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
			).run(userId, tenant_id, email, passwordHash, 'user');
		});

		if (outcome === 'tenant_exists') {
			return c.json(
				{ success: false, message: 'Tenant already exists; ask its administrator for access' },
				409
			);
		}
		if (outcome === 'user_exists') {
			return c.json({ success: false, message: 'User already exists' }, 409);
		}

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
 * GET /me - Current user, read from the live session and users table
 */
app.get('/me', async (c) => {
	const auth = await authenticate(c.req.header('Authorization'), db);
	if (!auth) return c.json({ success: false, message: 'Unauthorized' }, 401);
	return c.json({
		success: true,
		user: { id: auth.userId, email: auth.email, role: auth.role, tenant_id: auth.tenantId },
	});
});

/**
 * POST /logout - Revoke the session so its token stops working in every service
 */
app.post('/logout', async (c) => {
	const auth = await authenticate(c.req.header('Authorization'), db);
	if (!auth) return c.json({ success: false, message: 'Unauthorized' }, 401);
	db.prepare('DELETE FROM sessions WHERE id = ?').run(auth.sessionId);
	globalCache.delete(`session:${auth.sessionId}`);
	return c.json({ success: true, message: 'Logged out' });
});

export default app;
