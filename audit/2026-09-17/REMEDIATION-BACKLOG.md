# REMEDIATION BACKLOG — hcc-straw portfolio

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260917-hcc-straw` |
| **Date** | 2026-09-17 |
| **Basis** | FULL audit with executed builds (`FULL-AUDIT.md`, `BUILD-VERIFICATION.md`, `SRC-ID-MAP.md`) |
| **Exit target** | Re-audit ≥80% with flagship installable by a third party from docs alone |

Effort scale: S < 2h · M < 1d · L < 1w.

## P0 — Security & honesty (this week)

| # | Task | BUG | Effort | Done when |
|---|------|-----|:------:|-----------|
| P0-1 | Rotate exposed secrets: ZAP Plesk panel user/pass, venice.ai + ollama.ai keys (`hcc-fda/.../RadixLabsApp/.env`), OpenClaw DB password + API key + webhook secret + 3 tokens (`openclaw-integration/.env`), DocuSign/Forge keys (`hcc-pharma-web/.env`), ramblox SESSION_SECRET, apps/web JWT_SECRET | BUG-06 | M | All rotated; `.env*` confirmed gitignored; git history checked for past commits of these files |
| P0-2 | Decide flagship: adopt **SUE v5.0.0** as market flagship (verified: bundle + unit 4/4 + prebuilt WASM); record in SSOT Phase 2 | — | S | SSOT amended with flagship decision |
| P0-3 | BaaS security floor: replace SHA-256 with bcrypt/argon2 (`auth-service/index.ts:20-22`); remove fallback JWT secret (`:11`) — fail fast if env unset; add JWT auth middleware to data/billing/storage/analytics (kill `X-Tenant-ID` trust); pin hono and pass `alg:'HS256'` to `verify()` | BUG-02/03/04 | M | Sandbox curl matrix re-run: spoofed tenant → 401; valid token → 200 |
| P0-4 | BaaS installability: add `package.json` to 10 packages, regenerate lockfile with real deps, fix extensionless imports, replace `app.listen()` with `@hono/node-server` serve, add missing `Caddyfile` or drop the compose service | BUG-01 | M | `pnpm install --frozen-lockfile` && services start && `tests/integration.test.ts` runnable |
| P0-5 | OpenClaw: fix `loadRuntimeConfig` export mismatch (`integration-controller.js:20-22` → use `loadEnv`/`initializeRuntimeConfig`); make `npm test` point at the real harness or add jest tests | BUG-05 | S | `node -e "require('./bin/openclaw.js')"` exits clean; `test-all-integrations.js` runs |
| P0-6 | Retract false claims: SUE `ecosystem/README.md` + `ECOSYSTEM_BUILD_COMPLETE.md` (0 LOC); SaaS `docs/FINAL_VERIFICATION_REPORT.md` + `EXPANDED_SAAS_FRAMEWORK.md` (26/43 mock/stub); Mantle README (1/8 services, "SQLite3 Edition"); root `TODO.md` (Postgres/Redis/MinIO, `C:\hcc-straw` paths); root `docs/` 5 reports ("100% COMPLETE") | BUG-07/08/11/15 | M | Every public claim matches executed evidence |

## P1 — Product repair (this month)

| # | Task | BUG | Effort | Done when |
|---|------|-----|:------:|-----------|
| P1-1 | apps/web: add `@hookform/resolvers/zod`, create/restore `./services/api` module, fix 17 tsc errors — **or** rename/demote to `@autarch/web-mock` with honest README | BUG-09 | M | `next build` exit 0 |
| P1-2 | SaaS generator: `ignore=shutil.ignore_patterns('.git')` on copytree; delete 198 nested `.git` repos; add `maturity` field per component in `config.json` (4 production / 13 partial / 14 mock / 12 stub per this audit) | BUG-08/12 | S | Fresh bundle contains zero `.git`; `--list-components` shows maturity |
| P1-3 | STRAW: remove/quarantine `src/no-code/` (18 orphaned React files) and resolve duplicate `src-tauri/src/no_code/` module; delete shadowed `playwright.config.cjs`; delete or rewire specs targeting :3001/:3002 | BUG-13/19 | M | svelte-check ≤ 5 errors; one playwright config |
| P1-4 | SUE: bump chrome/firefox manifests to 5.0.0; add `"packageManager": "pnpm@…"` or de-chain pnpm from scripts; correct e2e claims (40 cases); prune `SUEv4.0/`, `Chatbox/` (224 MB), trashed 89 MB docx, stale `hcc_sidebar_view` pkg | BUG-14 | M | Manifests consistent; repo < 300 MB; docs match disk |
| P1-5 | FDA: convert nested `RadixLabsApp/.git` (3.8 GB) to proper submodule or vendor it; fix Quick-Start to `hcc-rams/RadixLabsApp`; remove or implement `npm run seed`; delete byte-identical duplicate Documentation trees | BUG-10 | M | `git submodule status` clean or gitlinks gone; README path verified |
| P1-6 | Ramblox: make `setup-database.mjs` seed idempotent (INSERT OR IGNORE / upsert); purge Supabase from README + `docs/` + stale `output/AUDIT_REPORT.md`; reconcile test-count claims (20 vs 10) | BUG-17 | S | `setup-db` exit 0 on live DB twice in a row |
| P1-7 | Pharma: add docker-compose MySQL for tests + env injection in `vitest.config.ts`; write a README (none exists); prune empty `New folder/` + 6 loose seed scripts | BUG-18 | S | vitest 28/28 |

## P2 — Portfolio hardening (this quarter)

| # | Task | BUG | Effort | Done when |
|---|------|-----|:------:|-----------|
| P2-1 | License map: add LICENSE file + field to SRC-SAAS, SRC-BAAS, SRC-RAMBLOX, SRC-FDA, SRC-MANTLE, SRC-FRAMEWORK, SUE ecosystem; resolve STRAW MIT-vs-proprietary contradiction | BUG-16 | S | Every package.json/Cargo.toml/pyproject has license + file |
| P2-2 | Install Rust toolchain + wasm-pack + Playwright browsers on build host; re-run: `cargo tauri build` (straw-app), `cargo test --workspace` (SaaS 32 crates / 35 tests), `build:wasm` (SUE), e2e suites | — | M | Executed results appended to BUILD-VERIFICATION.md |
| P2-3 | Sovereignty register: formally register or migrate every exemption in `SRC-ID-MAP.md` (SSOT Phase 3 amendment); decide Mantle/FDA/Pharma stack fate (Postgres/MySQL vs SQLite canon) | — | L | SSOT Phase 3 table complete |
| P2-4 | Root hygiene: delete/archive `audit_results.csv` (255 MB), 0-byte listing files, `debug.log`, `.lnk`, pasted PNG, `https___*` error page; move AHFC/AI-HIGHWAY corpus + governance docs into tracked `docs/governance/` or separate repo | BUG-20 | S | Root contains only tracked-intent files |
| P2-5 | Portfolio CI: one root orchestrator (or per-SKU CI) running the verified green commands from `BUILD-VERIFICATION.md` | — | L | CI badge per green SKU |
| P2-6 | HammurabiDev: add `.psd1` manifest, Pester tests, fix `Modules/`/`Docs/` doc paths, verify GitHub URL | — | M | Module imports clean in pwsh |

## Re-audit exit criteria (target ≥80%)

- [ ] P0 fully closed (secrets rotated, flagship locked, BaaS secured+installable, OpenClaw runs, false docs corrected)
- [ ] Flagship (SUE) installed by a third party from docs alone — fresh-machine evidence
- [ ] `cargo` + Playwright suites executed; results appended
- [ ] License map complete; sovereignty exemptions registered
- [ ] No committed secrets, no nested `.git` propagation, no 0-day-stale output bundles
