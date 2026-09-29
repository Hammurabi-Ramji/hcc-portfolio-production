# BUILD VERIFICATION — executed runtime evidence

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260917-hcc-straw` |
| **Execution date** | 2026-09-17 |
| **Host** | Windows 11, Git Bash; node v24.15.0 (Kimi runtime), npm/npx 11.12.1 via full path, Python 3.12.14 (managed), pnpm via `npx pnpm@9/10` |
| **Unavailable toolchains** | cargo / rustc / wasm-pack (no Rust), Playwright browsers (not downloaded), pwsh (not exercised), MySQL/Postgres/Redis (no local servers) |
| **Evidence root** | `audit/2026-09-17/build-evidence/` |

Prior Tier-0 audit executed **nothing**; this pass executed every buildable target. Legend: ✅ green · ⚠️ partial · ❌ failed · ⛔ env-blocked.

## Results matrix

| Product | Install | Type/lint check | Build | Tests | Serve/run smoke | Evidence |
|---------|---------|----------------|-------|-------|----------------|----------|
| Scrivfactory 0.2.0b1 | ✅ fresh `.venv-audit`, `pip install -e .[dev]` | — | — | ✅ **pytest 12/12** | ✅ `create fda_compliance` → valid `.scriv` (60 files; .scrivx parses; 140 binder items) | `build-evidence/scrivfactory/` |
| SaaS generator 1.3.0 | n/a (stdlib) | — | — | — | ✅ `--list-components` 43, `--list-templates` 9, `--template healthcare_saas` generated 22/22, manifest v1.3.0 schema ⚠️ propagates nested `.git` (16/22) | `build-evidence/saas-gen/` |
| SUE extension 5.0.0 | ✅ npm 623 pkgs | — | ✅ webpack bundle → dist (`sue-runtime.wasm` 1,263,147 B etc.) | ✅ unit **4/4** (`node --test`); ⛔ e2e 40 cases (no browsers) | prebuilt WASM verified (`\0asm` magic) → extension loadable w/o cargo | `build-evidence/sue/` |
| straw-app 0.1.0 (Svelte+Tauri) | ✅ npm 91 pkgs | ❌ svelte-check **247 errors / 18 files** (~215 from orphaned `src/no-code/` React) | ✅ vite build → `build/` 286 KB, 21 files; orphan dir NOT bundled | ⛔ e2e (no browsers; 2 conflicting configs; specs target nonexistent :3001/:3002) | ⛔ `cargo tauri build` (no cargo) | `build-evidence/straw/` |
| apps/web @autarch/web 1.0.0 | ✅ npm 382 pkgs | ❌ tsc **17 errors** (missing `@hookform/resolvers/zod`, missing `./services/api` module, broken axios types) | ❌ `next build` FAILS (module not found) | — | ❌ | `build-evidence/straw/apps-web-*.log` |
| HOLO-9 BaaS 0.1.0 | ❌ `pnpm install --frozen-lockfile` FAILS (`ERR_PNPM_OUTDATED_LOCKFILE`); `node packages/auth-service/index.ts` FAILS (`hono` missing); `node start-dev.ts` FAILS | — | — | — | ⚠️ sandbox boot (hono+better-sqlite3+uuid installed, extensionless imports fixed in copy): register/login/collections/records all 200; migrations create real tables (auth.db 4 tables, data.db 4+FTS5); ❌ JWT-protected `/me` 401 with hono@4.13 (`alg` required); ❌ unauthenticated cross-tenant read/write via spoofed `X-Tenant-ID` demonstrated | `build-evidence/baas/` |
| Ramblox 2.0.0 | ✅ pnpm 500 pkgs (better-sqlite3 node-gyp OK) | — | ✅ `next build` 16/16 pages, 14 routes | — | ✅ `next start -p 3107`: `/`, `/login`, `/api/games` → 200 w/ live SQLite JSON; ⚠️ `setup-db` seed non-idempotent (UNIQUE constraint `games.id`) | `build-evidence/ramblox/` |
| Radix Labs web 1.0.0 (pharma) | ✅ pnpm 809 pkgs | ✅ tsc **0 errors** | ✅ vite build 2,909 modules + esbuild server bundle | ⚠️ vitest **25/28** — 3 fail `TRPCError: Database not available` (no MySQL on 127.0.0.1:3306; vitest doesn't inject env) | — | `build-evidence/pharma/` |
| OpenClaw 1.0.0 | ✅ npm 642 pkgs (PUPPETEER_SKIP_DOWNLOAD) | — | — | ❌ `npm test` (jest): 0 test files; ❌ bespoke harness crashes pre-test | ❌ `require('./bin/openclaw.js')` throws `TypeError: loadRuntimeConfig is not a function` (`integration-controller.js:20-22` vs `config/runtime-config.js` exports) — **no executable path runs** | `build-evidence/openclaw/` |
| Mantle 1.0.0 | ❌ not attempted — root package.json declares **zero runtime deps**; installable-as-shipped = false by inspection | — | — | — | — | analysis evidence |
| FDA RadixLabsApp 1.0.0 | ❌ not attempted — 3.8 GB nested git repo; deleted gitlink Quick-Start path | — | — | — | — | analysis evidence |
| HammurabiDev framework | ⛔ no pwsh exercised | — | — | — | — | — |
| SaaS Rust workspace (32 crates) | ⛔ no cargo | — | — | 35 inline `#[cfg(test)]` fns not run | — | — |
| SUE `build:wasm` | ⛔ no wasm-pack (prebuilt pkg committed = mitigation) | — | — | — | — | — |

## Key runtime-proven findings (new since Tier-0)

1. **BaaS cannot be installed or started by any documented path** — frozen lockfile mismatch, missing workspace manifests (10/11 packages), unresolved `hono`, `app.listen()` on Hono apps, missing `Caddyfile`. (`1a/1b/1c-*.log`)
2. **BaaS service logic is real but two fixes away from working**: extensionless ESM imports fail under Node 24; JWT `verify()` needs explicit `alg` on current hono — all protected endpoints 401 as written. (`2b–2g` logs)
3. **Cross-tenant data exposure demonstrated live**: no `Authorization` header + spoofed `X-Tenant-ID: tenant-a` → 200 on collection/record create+read of another tenant's data. (`2e-curl-tests.log`)
4. **OpenClaw ships dead**: every entrypoint crashes at require time — `loadRuntimeConfig` does not exist in `config/runtime-config.js` exports. Deterministic code defect, not environment.
5. **apps/web build failure is worse than mock APIs**: genuinely missing dependencies (`@hookform/resolvers/zod`) and a missing `./services/api` module.
6. **Six products verifiably green**: scrivfactory (install+tests+create), SaaS generator (list+generate), SUE (install+unit+bundle), straw-app (vite build), ramblox (build+serve), pharma (tsc+build+25/28 tests).
7. **Nested `.git` propagation confirmed at generation time**: 16 of 22 components in a freshly generated healthcare bundle carry embedded `.git` dirs.
8. **Ramblox `setup-db` is not idempotent** against the live pre-seeded DB (UNIQUE constraint crash at `setup-database.mjs:127`); schema itself applies cleanly.

## Environment-blocked (require toolchain, not code fixes)

| Item | Blocker | Mitigation path |
|------|---------|-----------------|
| All Rust builds (Tauri straw-app, SaaS 32 crates, SUE build:wasm, FDA tauri-src) | no cargo/rustc/wasm-pack | install Rust toolchain + wasm-pack; SUE ships prebuilt WASM so extension still loads |
| Playwright e2e (SUE 40 cases, straw-app 2 suites) | no browsers installed | `npx playwright install chromium` then run |
| Pharma 3 failing tests | no local MySQL | provide dockerized MySQL or inject test DATABASE_URL in vitest config |
| HammurabiDev module syntax/behavior | pwsh not exercised | run `pwsh -NoProfile -Command "Import-Module ./HammurabiDev.psm1"` smoke |
