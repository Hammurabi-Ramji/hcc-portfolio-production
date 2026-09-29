# FULL PROJECT AUDIT — hcc-straw

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260917-hcc-straw` |
| **Audit date** | 2026-09-17 |
| **Assigned path** | `C:\IEDB\external\BSM-C\hcc-straw` |
| **Auditor tier** | Staff Engineer — Tier 1 |
| **Mode** | **FULL** — deep inventory of all 11 SRC-IDs + **executed** installs/builds/tests (runtime evidence in `build-evidence/`) |
| **Supersedes** | Tier 0 STAGED audit `UD-20260719-hcc-straw` (`PROJECT-STATUS-AUDIT.md`), which sampled docs/manifests and executed nothing |
| **Goal lens** | Marketable / usable product(s) |
| **Verdict** | Portfolio score holds at **67%** but confidence upgrades Medium→**High**: six products verifiably build/run green, three are **broken as shipped** (BaaS, apps/web, OpenClaw), and the strongest ship candidates are confirmed: **SUE v5** (extension bundle built, unit 4/4) and **Scrivfactory β** (12/12 tests, valid `.scriv` output) |

---

## Maturity

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Overall maturity** | **Tier 3 — Partial Production Portfolio** (held) | Deep inventory + executed builds confirm the Tier-0 verdict; no basis to upgrade or downgrade the tier |
| **Product readiness** | Verified green: SUE, Scrivfactory, Ramblox, Pharma-web, straw-app frontend, SaaS generator. Broken as shipped: HOLO-9 BaaS (install+start), apps/web (build), OpenClaw (runtime crash) | Portfolio still lacks one unified SKU |
| **Sovereignty posture** | **Mixed / non-canonical vs AUTARCH V10.0** (confirmed, now fully registered) | Full exemption register in `SRC-ID-MAP.md`; canon-aligned cores verified in STRAW (rusqlite/Ollama), BaaS shared modules, RAMBLOX (better-sqlite3), SUE (Leptos/WASM), SCRIV (stdlib+PyYAML) |
| **Security posture** | **Critical findings, runtime-proven** | Live secrets on disk in 3 products; BaaS cross-tenant spoof demonstrated; unsalted SHA-256 passwords; broken JWT verify |
| **Doc trust** | **Low** | `docs/` "100% COMPLETE / PRODUCTION-READY" reports contradicted by executed evidence across BaaS, SaaS components, SUE ecosystem, Mantle |

**Maturity label:** `T3-PORTFOLIO-PARTIAL` (confidence: High)

---

## % Complete

| Metric | Value |
|--------|-------|
| **% Complete** | **67%** (Tier-0 STAGED estimate was 68% — score holds, now evidence-backed) |
| **Confidence** | **High** — full tree inventory + executed builds/tests on 8 of 11 SRC-IDs |

### Rubric (same weights as Tier-0; executed evidence)

| Criterion | Weight | Score | Δ vs Tier-0 | Rationale (executed) |
|-----------|--------|-------|:---:|----------|
| Source / implementation present | 20% | 15/20 | = | Deep inventory confirms substantial real code; also quantified the shallow layer: SaaS 4 prod/13 partial/14 mock/12 stub of 43; BaaS 6/11 stubs; SUE ecosystem 0 LOC; Mantle 1/8 services |
| Build / run entrypoint | 20% | 13/20 | −1 | Executed: 6 green, **3 broken as shipped** (BaaS frozen-lockfile/hono/imports; apps/web missing deps; OpenClaw require-time crash); no root orchestrator |
| Product identity (README / name / version) | 15% | 12/15 | = | Versions confirmed on disk (SUE 5.0.0, SaaS 1.3.0, Scrivfactory 0.2.0b1, Ramblox 2.0.0); SUE manifest version drift (4.0.0 chrome/firefox) found |
| Usable deliverable | 20% | 13/20 | +1 | Verified artifacts: SUE webpack bundle + prebuilt WASM, valid `.scriv` package, Ramblox serving live SQLite data, Pharma dist bundle, generated SaaS bundle |
| Tests / verification | 10% | 6/10 | = | Executed: SUE unit 4/4, Scrivfactory 12/12, Pharma 25/28 (3 DB-blocked); zero CI except SUE ci.yml; OpenClaw jest stub; straw svelte-check red |
| Docs / SSOT | 10% | 6/10 | −1 | Pervasive doc drift proven at runtime (BaaS README honest but TESTING_GUIDE/PERFORMANCE_BENCHMARKS/TODO.md false; SaaS "no placeholders" false; SUE ecosystem "COMPLETE" false) |
| Market / packaging surface | 5% | 2/5 | = | SUE release EXEs/zips exist; no portfolio storefront; license chaos (7 SRC-IDs with no license at all) |
| **Total** | **100%** | **67/100** | **−1** | **→ 67% complete, High confidence** |

---

## Completed (verified by execution this pass)

- [x] SUE v5.0.0: `npm install` (623 pkgs), unit tests **4/4**, webpack bundle green with real WASM artifacts — extension loadable without cargo
- [x] Scrivfactory 0.2.0b1: fresh venv install, **pytest 12/12**, `create fda_compliance` → structurally valid `.scriv` (60 files, 140 binder items)
- [x] SaaS generator 1.3.0: 43 components / 9 templates listed; healthcare_saas bundle generated 22/22 with v1.3.0 manifest
- [x] straw-app: `npm install`, vite build green (286 KB static site, 21 files)
- [x] Ramblox: pnpm install, `next build` 16/16 pages, live server smoke (3 routes 200 with real SQLite data)
- [x] Pharma web: pnpm install, tsc 0 errors, vite build green, vitest 25/28
- [x] BaaS negative proof: all documented install/start paths fail (exact errors logged)
- [x] BaaS positive proof: sandbox-booted auth+data services — register/login/CRUD/migrations/FTS5 all functional
- [x] Deep inventory: all 11 SRC-IDs walked; 43 SaaS components individually graded; 11 BaaS services individually graded; SUE ecosystem proven 0 LOC

---

## Bugs / Defects (all evidence-gated; runtime-proven items marked ⚡)

| ID | Sev | SRC | Evidence | Description |
|----|-----|-----|----------|-------------|
| BUG-01 | **Critical** | BAAS | `build-evidence/baas/1a-1c*.log` ⚡ | Uninstallable/unstartable as shipped: frozen-lockfile mismatch, `hono` unresolved, 10/11 packages no manifest, extensionless ESM imports fail on Node 24, `app.listen()` on Hono, missing `Caddyfile` |
| BUG-02 | **Critical** | BAAS | `auth-service/index.ts:20-22` ⚡ | Unsalted SHA-256 password hashing (self-commented "in production, use bcrypt") |
| BUG-03 | **Critical** | BAAS | `2e-curl-tests.log` ⚡ | Cross-tenant read/write with no auth: spoofed `X-Tenant-ID` header yields 200s on another tenant's data; zero JWT verification on data/billing/storage/analytics |
| BUG-04 | **Critical** | BAAS | `2f/2g-*.log` ⚡ | JWT `verify()` broken with hono@4.13 (`alg` required) — all protected endpoints 401 even with valid tokens |
| BUG-05 | **Critical** | OPENCLAW | `import-smoke.log` ⚡ | `loadRuntimeConfig` not exported (`integration-controller.js:20-22`) — every entrypoint crashes at require time; product is dead as shipped |
| BUG-06 | **Critical** | FDA/OPENCLAW/PHARMA | `.env` files on disk | Live secrets: ZAP Plesk panel credentials, venice.ai + ollama.ai API keys (FDA); DB password + 3 service tokens (OpenClaw); DocuSign/Forge keys (Pharma). Rotation required |
| BUG-07 | High | SUE | analysis + `manifests.log` ⚡ | Ecosystem "7 production-ready apps" = 6 manifest-only scaffolds, **0 LOC**; README/ECOSYSTEM_BUILD_COMPLETE claims false |
| BUG-08 | High | SAAS | component grading table ⚡ | 26/43 components are mock/stub while `docs/FINAL_VERIFICATION_REPORT.md` claims "100%… production-grade, no placeholders" |
| BUG-09 | High | STRAW | `apps-web-next-build.log` ⚡ | apps/web fails to build: missing `@hookform/resolvers/zod` + missing `./services/api` module + 17 tsc errors; README claims production-ready Postgres/Express/Drizzle stack that doesn't exist |
| BUG-10 | High | FDA | git evidence | Quick-Start path `Radix_App/RadixLabsApp` is a deleted gitlink; real app in 3.8 GB nested git repo; no `.gitmodules` |
| BUG-11 | High | MANTLE | analysis | 1/8 microservices real (2 missing entirely, 5 loose paste files); root package.json has zero runtime deps; "SQLite3 Edition" claim vs Postgres Prisma datasource; auth password check commented out (`server.js:146`) |
| BUG-12 | Medium | SAAS | `saas-gen/output-tree.log` ⚡ | 198 nested `.git` repos; copytree propagates them into generated bundles (16/22 in fresh healthcare bundle) |
| BUG-13 | Medium | STRAW | `straw-app-svelte-check.log` ⚡ | Orphaned React `src/no-code/` (18 uncompilable files) drives svelte-check to 247 errors; duplicate second Tauri app in `src-tauri/src/no_code/` |
| BUG-14 | Medium | SUE | `manifests.log` ⚡ | manifest.chrome/firefox.json stuck at 4.0.0 vs 5.0.0; e2e doc claim "18/18" vs 40 cases on disk; scripts chain `pnpm` without `packageManager` field |
| BUG-15 | Medium | ROOT | TODO.md vs docker-compose.yml | TODO.md instructs compose to start Postgres/Redis/MinIO — compose has none (5 services + missing Caddy only); stale `C:\hcc-straw\...` paths |
| BUG-16 | Medium | ALL | SRC-ID-MAP license column | 7 of 11 SRC-IDs ship no license; STRAW has MIT (package.json) vs proprietary (README) contradiction |
| BUG-17 | Low | RAMBLOX | `setup-db.log` ⚡ | Seed script non-idempotent (UNIQUE constraint on live DB); README Tech Stack still says Supabase (code is better-sqlite3) |
| BUG-18 | Low | PHARMA | `vitest.log` ⚡ | 3 tests fail on missing local MySQL; vitest doesn't inject env; no local DB provisioning path |
| BUG-19 | Low | STRAW | analysis | Two conflicting Playwright configs (`.ts` shadows `.cjs`); specs target nonexistent services :3001/:3002 |
| BUG-20 | Low | ROOT | SRC-ROOT findings | Staging-floor pollution: 255 MB `audit_results.csv`, 0-byte listing files, crashpad `debug.log`, `.lnk`, saved error page; all gitignored but physically present |

---

## Priority Queue

### P0 — this week
1. **Rotate all exposed secrets** (BUG-06) — ZAP panel, venice.ai, ollama.ai, OpenClaw DB/tokens, DocuSign/Forge; purge `.env` files from any tracked history; add root-level `.env` sweep to hygiene routine
2. **Lock flagship SKU** — evidence now supports **SUE v5** (verified bundle + unit green + prebuilt WASM) with **Scrivfactory β** as second ship candidate; freeze "portfolio production-ready" language
3. **Fix BaaS honesty + security floor** (BUG-01…04): either repair install path (workspace manifests, lockfile, imports, JWT alg, bcrypt/argon2, auth middleware) or publicly scope HOLO-9 to "5 runnable core services (sandbox-verified)"
4. **Kill or fix OpenClaw entrypoint** (BUG-05) — one-line export mismatch makes the whole product dead
5. **Correct false docs** (BUG-07/08/11/15): SUE ecosystem README, SaaS FINAL_VERIFICATION_REPORT, Mantle README, root TODO.md, `docs/` 100%-COMPLETE reports

### P1 — this month
6. apps/web: add missing deps + `./services/api` or formally demote to "mock frontend" (BUG-09)
7. SaaS generator: strip nested `.git` on copy; add maturity labels (`production`/`partial`/`mock`/`stub`) to `config.json` (BUG-08/12)
8. STRAW: delete or quarantine orphaned `src/no-code/` + resolve duplicate `no_code/` Tauri module; unify Playwright configs (BUG-13/19)
9. SUE: sync manifests to 5.0.0, add `packageManager`, refresh e2e count claims, add `alg` note for WASM/build docs (BUG-14)
10. FDA: repair gitlink/submodule situation, fix Quick-Start path, deduplicate `Radix_App`/`hcc-rams` Documentation (BUG-10)

### P2 — this quarter
11. License map: add LICENSE files / fields across 7 unlicensed SRC-IDs; resolve STRAW MIT-vs-proprietary (BUG-16)
12. Install Rust toolchain + Playwright browsers; re-run blocked suites (tauri build, 32-crate cargo test, e2e)
13. Root hygiene: archive/delete staging strays (255 MB csv, 0-byte files, .lnk); move AHFC/AI-HIGHWAY corpus into a tracked docs project (BUG-20)
14. Ramblox idempotent seed + README Supabase purge (BUG-17); Pharma local MySQL test provisioning (BUG-18)

Full task-level detail with effort estimates: `REMEDIATION-BACKLOG.md`.

---

## Unverified (explicit)

| Item | Why |
|------|-----|
| All Rust builds (straw-app Tauri, SaaS 32 crates / 35 test fns, SUE build:wasm, FDA tauri-src) | No cargo/rustc/wasm-pack on host |
| Playwright e2e suites (SUE 40 cases; straw-app 2 configs) | No browsers installed; dry-run evidence only |
| Pharma cart/contact tests (3) | No local MySQL on 127.0.0.1:3306 |
| SUE ecosystem runtime | 0 LOC — nothing to run |
| Mantle / FDA app runtime | Not installable as shipped (zero-deps manifest; broken gitlink) |
| HammurabiDev PowerShell module | pwsh not exercised |
| Zap/Ziggurat VPS deploys | Out of scope; live VPS IP noted in SUE config |
| `hcc-straw-sue` ~570 MB binaries (Chatbox, release EXEs) | Presence verified; binaries not executed |

---

## Return Summary (for parent rollup)

| Field | Value |
|-------|-------|
| **Maturity** | Tier 3 — Partial Production Portfolio (`T3-PORTFOLIO-PARTIAL`) |
| **% Complete** | **67%** (confidence **High**; executed builds) |
| **Flagship recommendation** | **SUE v5.0.0** (verified); runner-up Scrivfactory 0.2.0b1 (verified) |
| **Critical blockers** | Secrets rotation; BaaS security+install; OpenClaw dead entrypoint; false "production-ready" docs |
| **Audit pack** | `audit/2026-09-17/FULL-AUDIT.md` (this file) · `SRC-ID-MAP.md` · `BUILD-VERIFICATION.md` · `REMEDIATION-BACKLOG.md` · `build-evidence/` logs |
| **UD-ID** | `UD-20260917-hcc-straw` (amends `UD-20260719-hcc-straw`) |
