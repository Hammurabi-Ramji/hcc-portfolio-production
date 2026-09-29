# SRC-ID MAP — hcc-straw portfolio (FULL audit)

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260917-hcc-straw` |
| **Map date** | 2026-09-17 |
| **Basis** | FULL deep inventory (all trees walked) + executed builds; supersedes STAGED sampling of `UD-20260719-hcc-straw` |
| **Root** | `C:\IEDB\external\BSM-C\hcc-straw` |

File counts exclude `node_modules`, `target`, `.git`, `__pycache__`, `.venv*`, `dist`, `.next` unless noted. Git: 1,545 tracked files at root, branch `feat/vps-sue-setup`.

## Portfolio map

```
hcc-straw/                       ROOT — staging floor (only .gitignore + README.md tracked)
├── audit/2026-09-17/            THIS AUDIT (reports + build-evidence logs)
├── hcc-straw/                   SRC-STRAW    — STRAW desktop stack (Svelte 5 + Tauri 2 + Rust/WASM) + apps/web (Next)
├── hcc-straw-saas/              SRC-SAAS     — SaaS generator (Python controller v1.3.0 + 43 components + 9 templates)
├── hcc-straw-baas/              SRC-BAAS     — HOLO-9 BaaS (11 Hono/TS services; 5 real, 6 stubs)
├── hcc-straw-sue/               SRC-SUE      — SUE v5.0.0 MV3 extension + ecosystem scaffolds (~818 MB incl. junk)
├── hcc-straw-ramblox/           SRC-RAMBLOX  — Ramblox v2.0.0 (Next 15 + R3F + better-sqlite3)
├── hcc-framework/               SRC-FRAMEWORK— HammurabiDev PowerShell module (5 files)
├── openclaw-integration/        SRC-OPENCLAW — scraping/automation kit v1.0.0 (Proprietary)
├── hcc-fda/                     SRC-FDA      — 47 SOP docs + RadixLabsApp (3.8 GB nested git repo)
├── scrivfactory/                SRC-SCRIV    — Scrivener template factory v0.2.0b1 (Python CLI)
├── hcc-mantle/                  SRC-MANTLE   — Northstar flooring v1.0.0 (1/8 microservices real)
├── hcc-pharma-web/              SRC-PHARMA   — Radix Labs web v1.0.0 (Vite + tRPC + Drizzle/MySQL, 33.7k LOC)
├── docs/                        5 tracked "100% COMPLETE" reports (proven overstated — see FULL-AUDIT)
├── data/                        ramblox.db live WAL state (gitignored)
└── [root strays]                255 MB audit_results.csv, 0-byte listing files, debug.log, .lnk, pasted PNG
```

## Per-SRC-ID inventory & classification

| SRC-ID | Files¹ | Size / LOC | Version | License² | Maturity (verified) | Build status (executed 2026-09-17) |
|--------|-------:|------------|---------|----------|--------------------|-----------------------------------|
| SRC-STRAW | 284 | 2.5 MB src; ~75 core src files | straw-stack 0.1.0 / @autarch/web 1.0.0 | MIT claimed, **no LICENSE file** | **Partial-prod**: real Tauri v2 + 11 Rust nodes + rusqlite + local-Ollama; orphaned React `no-code/` dir; apps/web is mock APIs | straw-app vite build **GREEN** (286 KB, 21 files); svelte-check **RED** (247 errors, ~215 from orphan dir); apps/web `next build` **FAILS** (missing deps); Tauri/wasm-pack ENV-BLOCKED (no cargo) |
| SRC-SAAS | 914 | ~14 MB; 411 .rs | gen 1.3.0; all crates 0.1.0 | **none** (0 license fields) | 43 components: **4 production / 13 partial / 14 mock / 12 stub**; 9 templates resolve fully | Controller **GREEN**: lists 43/9, generates healthcare_saas bundle 22/22; Rust workspace ENV-BLOCKED (no cargo); nested-`.git` propagation defect confirmed (16/22 in generated bundle) |
| SRC-BAAS | 51 | small; 5 services ~1,446 LOC + 252 SQL | 0.1.0 | **none** | 5 services production-logic / 6 echo-stubs (prior claim verified exactly) | **FAILS as shipped**: frozen-lockfile mismatch, `hono` unresolved, extensionless imports, `app.listen()` on Hono; sandbox boot proves logic works EXCEPT JWT verify broken on hono@4.13 (`alg` required); tenancy spoof demonstrated via curl |
| SRC-SUE | 676 | ~13k core LOC JS/TS/Rust; tree ~818 MB w/ junk | 5.0.0 | MIT (LICENSE present in SUE/SUE) | **Strongest SKU**: real MV3 core, Leptos WASM prebuilt, release EXEs; ecosystem = 6 scaffolds, **0 LOC** | npm install 623 pkgs ✅; unit tests **4/4 PASS**; webpack bundle **GREEN** (sue-runtime.wasm 1.26 MB); e2e ENV-BLOCKED (no Playwright browsers; 40 cases on disk vs "18/18" doc claim); build:wasm ENV-BLOCKED |
| SRC-RAMBLOX | 81 | ~2.9k LOC TS/TSX + Lua templates | 2.0.0 | **none** | Small but real: 6 pages, 9 API routes, SQLite wired through all server modules | pnpm install ✅; `next build` **GREEN** (16/16 pages); serves live data on curl ✅; `setup-db` seed **non-idempotent** (UNIQUE constraint on pre-seeded db) |
| SRC-FRAMEWORK | 5 | 68 KB; psm1 = 1,337 lines | unversioned (no .psd1) | MIT claimed, no file | Partial-prod scaffolder; zero TODO markers; real SSH deploy logic | UNVERIFIED (no pwsh in audit env) |
| SRC-OPENCLAW | 52 | ~3,067 LOC JS/PY | 1.0.0 | **Proprietary** | Real scrapers (axios/cheerio) + scheduler; puppeteer/pg/redis/express declared but unused | install ✅; **every entrypoint CRASHES** — `loadRuntimeConfig` not exported by `config/runtime-config.js` (`integration-controller.js:20-22`); `npm test`=jest finds 0 files |
| SRC-FDA | 847 | ~10k LOC app + ~20.7k LOC SOP markdown | radixlabs-app 1.0.0 | **none** | Real Next/Express app over **18 empty scaffold dirs**; SOP corpus is the true payload; docs duplicate (`Radix_App` ≡ `hcc-rams`) | NOT EXECUTED — 3.8 GB nested git repo, gitlinks w/o `.gitmodules`, documented Quick-Start path deleted |
| SRC-SCRIV | 239 | ~2,030 LOC py | 0.2.0b1 | MIT declared, no file | **Cleanest SKU**: coherent CLI, 5 YAML templates, stdlib+PyYAML only | Fresh venv + `pip install -e .[dev]` ✅; pytest **12/12 PASS**; `create fda_compliance` → valid `.scriv` (60 files, .scrivx parses, 140 binder items) ✅ |
| SRC-MANTLE | 123 | ~28k LOC total (17.3k frontend src) | 1.0.0 | **none** | **1/8 microservices real**; 5 loose paste-artifact files; 2 missing; two parallel backends + two frontends | NOT EXECUTED — root package.json has **zero runtime deps** (cannot install as shipped); docker-compose undeployable (7/8 build contexts missing) |
| SRC-PHARMA | 256 | **33,685 LOC** ts/tsx; 36 pages, 18 tables | 1.0.0 | MIT (manifest only) | Most substantial web app; Manus-template origin; MySQL+S3+DocuSign cloud deps | pnpm install 809 pkgs ✅; tsc **0 errors**; vitest **25/28** (3 blocked by missing local MySQL); `vite build` **GREEN** |

¹ Excluding dependency/build dirs. ² "none" = no LICENSE file and no license field.

## Sovereignty exemption register (vs AUTARCH V10.0 canon)

| SRC-ID | Non-canonical surface | Status |
|--------|----------------------|--------|
| SRC-SUE ecosystem | Next 14, React, Expo/RN, Vue, Express, Prisma+PostgreSQL, Redis+Bull, socket.io | UNREGISTERED — and 0 LOC (register or delete) |
| SRC-SUE ops | Zap VPS + MySQL + Redis; live VPS IP `5.249.163.79` in `zap-hosting-config.json` | UNREGISTERED |
| SRC-STRAW apps/web | Next 15, React 19, Postgres/Redis (env only), JWT | UNREGISTERED; build broken |
| SRC-SAAS components | Stripe, S3, Redis(name), PostHog, Sentry, Loki, InfluxDB, Vault, Snowflake, Terraform/AWS, GH Actions, RN | UNREGISTERED; mostly mocks |
| SRC-BAAS infra | terraform provisions AWS RDS Postgres 16 + ElastiCache Redis (contradicts SQLite-first) | UNREGISTERED |
| SRC-OPENCLAW | pg, redis, puppeteer, express (declared, unused) | UNREGISTERED |
| SRC-FDA | Next, Postgres, Supabase(.env.example), Stripe, SendGrid, OpenAI, venice.ai, ollama cloud | UNREGISTERED; live keys on disk |
| SRC-RAMBLOX | Next 15, React 19, Vercel deploy script | UNREGISTERED |
| SRC-PHARMA | MySQL, AWS S3, DocuSign, Manus Forge/OAuth | UNREGISTERED |
| SRC-MANTLE | PostgreSQL (Prisma + sequelize/pg), Redis, Stripe | UNREGISTERED; "SQLite3 Edition" README claim false |
| Canon-aligned | rusqlite/better-sqlite3 (STRAW, BaaS, RAMBLOX), Leptos/WASM (SUE), local Ollama (STRAW, SAAS), PyYAML-only (SCRIV), zero-dep PowerShell (FRAMEWORK) | ✅ |

## Secrets exposure register (values never copied into audit artifacts)

| Location | Exposure | Git status |
|----------|----------|-----------|
| `openclaw-integration/.env` | LIVE DB password, API key, webhook secret, 3 service tokens | on disk |
| `hcc-fda/hcc-rams/RadixLabsApp/.env` | LIVE venice.ai + ollama.ai API keys, ZAP Plesk panel user/password, Stripe/OpenAI/SendGrid slots | on disk |
| `hcc-pharma-web/.env` | DocuSign + Manus Forge credentials, JWT_SECRET | gitignored, on disk |
| `hcc-straw-ramblox/.env.local:10` | 48-char SESSION_SECRET | gitignored, on disk |
| `hcc-straw/apps/web/.env.local` | DATABASE_URL, REDIS_URL, JWT_SECRET | gitignored, on disk |
| `hcc-straw-baas/packages/auth-service/index.ts:11` | fallback JWT secret `'hcc-straw-baas-secret'` in SOURCE | tracked |
| `hcc-mantle/.../docker-compose.yml` | default `JWT_SECRET=dev_secret_northstar_installations` | tracked |
| `hcc-straw-sue/SUE/ecosystem/docker-compose.yml:9` | `POSTGRES_PASSWORD: sue_password` | tracked |
