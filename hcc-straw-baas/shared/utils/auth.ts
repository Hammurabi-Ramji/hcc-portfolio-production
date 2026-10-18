import crypto from 'crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { SQLiteDB, createServiceDB } from '../db/sqlite';

/**
 * Shared authentication for every HOLO-9 service.
 *
 * The tenant boundary is the tenant of a verified, unexpired, unrevoked session
 * issued by auth-service. Client headers such as X-Tenant-ID are never trusted
 * on their own.
 */

const MIN_SECRET_LENGTH = 32;
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK = 8;
const SCRYPT_PARALLEL = 1;

export const TENANT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export interface AuthContext {
	userId: string;
	email: string;
	role: string;
	tenantId: string;
	sessionId: string;
}

/** Read the signing secret. Services refuse to start without a strong one. */
export function jwtSecret(): string {
	const secret = process.env.JWT_SECRET;
	if (
		!secret ||
		secret.length < MIN_SECRET_LENGTH ||
		/change|replace|your-|example|secret-key/i.test(secret)
	) {
		throw new Error(
			`JWT_SECRET must be a random value of at least ${MIN_SECRET_LENGTH} characters; no default or placeholder is accepted`
		);
	}
	return secret;
}

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

/** Salted scrypt hash, stored as scrypt$N$r$p$salt$hash. */
export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16);
	const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
		N: SCRYPT_COST,
		r: SCRYPT_BLOCK,
		p: SCRYPT_PARALLEL,
	});
	return [
		'scrypt',
		SCRYPT_COST,
		SCRYPT_BLOCK,
		SCRYPT_PARALLEL,
		salt.toString('hex'),
		hash.toString('hex'),
	].join('$');
}

function equal(a: Buffer, b: Buffer): boolean {
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verify a password. Legacy unsalted SHA-256 hashes still verify so existing
 * users can sign in; callers must then replace them (needsRehash).
 */
export function verifyPassword(password: string, stored: string): boolean {
	if (typeof stored !== 'string') return false;
	if (stored.startsWith('scrypt$')) {
		const [, n, r, p, saltHex, hashHex] = stored.split('$');
		const expected = Buffer.from(hashHex ?? '', 'hex');
		if (!saltHex || expected.length === 0) return false;
		const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
			N: Number(n),
			r: Number(r),
			p: Number(p),
		});
		return equal(actual, expected);
	}
	if (/^[0-9a-f]{64}$/.test(stored)) {
		const legacy = crypto.createHash('sha256').update(password).digest();
		return equal(legacy, Buffer.from(stored, 'hex'));
	}
	return false;
}

export function needsRehash(stored: string): boolean {
	return !stored.startsWith('scrypt$');
}

let authDb: SQLiteDB | null = null;
function sessionStore(): SQLiteDB {
	authDb ??= createServiceDB('auth');
	return authDb;
}

/**
 * Resolve a bearer token to a live session. The JWT signature, the session row
 * (by token hash), its expiry, the user's status and the tenant's status must
 * all agree; identity and role come from the database, not the token payload.
 */
export async function authenticate(
	authorization: string | undefined,
	db: SQLiteDB = sessionStore()
): Promise<AuthContext | null> {
	if (!authorization?.startsWith('Bearer ')) return null;
	const token = authorization.slice('Bearer '.length).trim();
	if (!token) return null;
	try {
		await verify(token, jwtSecret(), 'HS256');
	} catch {
		return null;
	}
	const row = db
		.prepare(
			`SELECT s.id AS session_id, s.expires_at, u.id AS user_id, u.email, u.role,
			        u.status AS user_status, u.tenant_id, t.status AS tenant_status
			   FROM sessions s
			   JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
			   JOIN tenants t ON t.id = u.tenant_id
			  WHERE s.token_hash = ?`
		)
		.get(hashToken(token)) as
		| {
				session_id: string;
				expires_at: string;
				user_id: string;
				email: string;
				role: string;
				user_status: string;
				tenant_id: string;
				tenant_status: string;
		  }
		| undefined;
	if (!row) return null;
	if (!(Date.parse(row.expires_at) > Date.now())) return null;
	if (row.user_status !== 'active' || row.tenant_status !== 'active') return null;
	return {
		userId: row.user_id,
		email: row.email,
		role: row.role,
		tenantId: row.tenant_id,
		sessionId: row.session_id,
	};
}

/**
 * Hono middleware: reject requests without a live session. A client may still
 * send X-Tenant-ID for compatibility, but it must name the session's tenant.
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
	const auth = await authenticate(c.req.header('Authorization'));
	if (!auth) {
		return c.json({ success: false, message: 'Unauthorized' }, 401);
	}
	const claimed = c.req.header('X-Tenant-ID');
	if (claimed !== undefined && claimed !== auth.tenantId) {
		return c.json({ success: false, message: 'Forbidden' }, 403);
	}
	c.set('auth', auth);
	await next();
};

export function authOf(c: Context): AuthContext {
	const auth = c.get('auth') as AuthContext | undefined;
	if (!auth) throw new Error('requireAuth middleware is not installed on this route');
	return auth;
}

/** The verified tenant for this request. */
export function tenantOf(c: Context): string {
	return authOf(c).tenantId;
}
