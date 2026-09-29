# SRC-BAAS BUILD/VERIFY Evidence Summary — 2026-09-17 (UTC)

Scope: `hcc-straw-baas/` (HOLO-9 BaaS). Node v24.15.0. No product source files modified; sandbox copy under `sandbox/`.

## Task 1 — Negative evidence (documented paths fail)

| # | Command | Result | Evidence |
|---|---------|--------|----------|
| 1a | `npx -y pnpm@9 install --frozen-lockfile` (Dockerfile path) | FAIL exit 1 | `ERR_PNPM_OUTDATED_LOCKFILE` — "specifiers in the lockfile ({}) don't match specs in package.json ({@types/node, hono, better-sqlite3})" for `packages/auth-service/package.json`. Log: `1a-pnpm-frozen-install.log` |
| 1b | `node packages/auth-service/index.ts` (documented `start`) | FAIL exit 1 | `ERR_MODULE_NOT_FOUND: Cannot find package 'hono'`. Log: `1b-node-auth-service.log` |
| 1c | `node start-dev.ts` | FAIL exit 1 | Same `Cannot find package 'hono'` (would also fail later: Hono app has no `.listen()`). Log: `1c-node-start-dev.log` |

Additional confirmed-by-inspection: `Caddyfile` referenced by docker-compose is absent (`ls`: No such file or directory).

## Task 2 — Positive evidence (sandbox boot)

Sandbox: `sandbox/` (copy of `packages/` + `shared/`). `npm install hono@4.13.8 @hono/node-server@2.1.1 better-sqlite3@13.0.3 uuid@14.0.2` — OK; better-sqlite3 native prebuilt for Node 24 works (`:memory:` smoke test passed). Log: `2-sandbox-npm-install.log`.

Boot required two sandbox-only fixes (recorded, NOT applied to product source):
1. Extensionless relative imports (`'../../shared/db/sqlite'`) → `ERR_MODULE_NOT_FOUND` under Node 24 ESM even with deps installed. Patched sandbox copies to `.ts` suffixes. Log: `2b-boot-first-attempt.log`.
2. `npm init -y` defaults `"type":"commonjs"` → named-export error; set `"type":"module"` (matches auth-service's own package.json). Log: `2c-boot-second-attempt.log`.

Then both services booted; migrations auto-applied. Log: `2d-boot-third-attempt.log`.

### curl results (Log: `2e-curl-tests.log`, `2f-me-debug.log`)
- `POST :3101/register` → 200 (user created, tenant-a)
- duplicate register → 409; wrong-password login → 401; correct login → 200 + JWT (token redacted in logs)
- `GET :3101/me` **with valid fresh Bearer token → 401 "Invalid token"** — RUNTIME DEFECT: token is a valid HS256 JWT (header `{"alg":"HS256","typ":"JWT"}`), but `hono/jwt` `verify()` in resolved hono@4.13.8 requires an explicit `alg` argument (`JwtAlgorithmRequired`); auth-service calls `verify(token, JWT_SECRET)` without it. Roundtrip sign/verify WITH `alg:'HS256'` succeeds. Logs: `2f-me-debug.log`, `2g-jwt-roundtrip.log`. So all JWT-protected endpoints (`/me`, `/logout`) are broken with the `^4.0.0` semver range as it resolves today.
- `GET :3101/me` without token → 401 (correct)
- **SECURITY DEMONSTRATED**: data-service has zero auth. With NO Authorization header, only a spoofed `X-Tenant-ID: tenant-a`:
  - `POST :3102/collections` → 200 (created `secret-docs`)
  - `POST :3102/records` → 200 (inserted "tenant-a secret")
  - `GET :3102/collections` → 200, returned tenant-a's collections
  - `GET :3102/records?collection_id=...` → 200, returned tenant-a's confidential record
  - `GET :3102/collections` with no header → 200, empty list (tenant `default`) — confirms header alone selects tenant
- Fallback JWT secret `'hcc-straw-baas-secret'` confirmed live (JWT_SECRET env unset; tokens signed/verified with it in sandbox).
- SHA-256 unsalted password hashing confirmed in code path exercised by register/login (works, but unsalted).

## Task 3 — Migrations verified at runtime (Log: `3-sqlite-tables.log`)

- `sandbox/.data/auth.db` tables: `audit_logs, sessions, tenants, users` (+1 user, +1 tenant, +2 sessions from test logins)
- `sandbox/.data/data.db` tables: `collections, record_versions, records, records_fts(+4 FTS5 shadow tables)` (+1 collection, +1 record, tenant_id `tenant-a`)

## Verdicts
(a) Documented install/start as shipped: **NO** — frozen-lockfile install fails (lockfile out of sync), and even a non-frozen install could not run services (`node index.ts` cannot resolve hono without workspace install; extensionless imports break Node ESM regardless; Hono has no `.listen()` for `start-dev.ts`; Caddyfile missing).
(b) Underlying service logic with deps provided: **MOSTLY YES** — auth register/login, data CRUD, migrations, FTS5 schema all function after sandbox-only import fixes; but JWT verify endpoints (`/me`, `/logout`) are broken with hono@4.13.8 due to missing `alg` argument.
(c) Missing-auth tenancy flaw demonstrated at runtime: **YES** — full unauthenticated cross-tenant read/write on data-service via spoofed `X-Tenant-ID` header (curl 200s above).
