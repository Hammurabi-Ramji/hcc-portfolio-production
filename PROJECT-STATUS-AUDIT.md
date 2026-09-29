# PROJECT-STATUS-AUDIT — hcc-straw

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260719-hcc-straw` |
| **Audit date** | 2026-07-19 |
| **Assigned path** | `C:\IEDB\external\BSM-C\hcc-straw` |
| **Auditor tier** | Staff Engineer — Tier 0 |
| **Mode** | **STAGED** (very large tree; ~32k files estimated — includes vendored `.venv-beta` / caches) |
| **Goal lens** | Marketable / usable product(s) — inferred from in-folder docs |
| **Verdict** | Multi-product production portfolio with several near-shippable SKUs (SUE, HOLO-9 core, Scrivfactory, STRAW app); not a single unified commercial package |

---

## Maturity

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Overall maturity** | **Tier 3 — Partial Production Portfolio** | Multiple real codebases with entrypoints, docs, and partial verification; uneven stub/complete mix |
| **Product readiness** | Portfolio of products; strongest: SUE v5, Scrivfactory β, HOLO-9 5/11 services, STRAW desktop flows UI | Root is a portfolio umbrella, not one installer SKU |
| **Sovereignty posture** | **Mixed / non-canonical vs AUTARCH V10.0** | Local-first SQLite/BaaS claims coexist with Next.js, PostgreSQL, Redis, Supabase mentions, Stripe/S3 components |
| **Naming / intent** | Clear at product level; thin at root | Root README: “HCC production portfolio — SUE, BaaS, SaaS, Ziggurat VPS” |

**Maturity label:** `T3-PORTFOLIO-PARTIAL`

---

## % Complete

| Metric | Value |
|--------|-------|
| **% Complete (toward marketable/usable portfolio products as documented)** | **68%** |
| **Confidence** | **Medium** — STAGED sampling of entrypoints/docs/manifests; runtime builds not executed; file count inflated by `.venv-beta` |

### Rubric (equal-category weights; evidence-only)

| Criterion | Weight | Score | Rationale |
|-----------|--------|-------|-----------|
| Source / implementation present | 20% | 15/20 | Substantial apps across SRC-* trees; BaaS 6/11 stubs; many SaaS components are thin/mock |
| Build / run entrypoint | 20% | 14/20 | Per-product scripts (`pnpm`, Python controller, Tauri, `pip install -e .`); no unified portfolio root orchestrator |
| Product identity (README / name / version) | 15% | 12/15 | Strong product READMEs + versions (SUE 5.0.0, SaaS gen 1.3.0, Scrivfactory 0.2.0b1); root README is one line |
| Usable deliverable (binary, service, package) | 20% | 12/20 | SUE loadable MV3 + installer scripts; HOLO-9 runnable services (docs); Scrivfactory CLI wheel path; not one market SKU |
| Tests / verification | 10% | 6/10 | SUE docs claim unit+e2e; Scrivfactory pytest/dev deps; straw-app has workflow tests; portfolio-wide CI not evidenced |
| Docs / SSOT (pre-existing) | 10% | 7/10 | Rich per-product docs/deploy guides; prior portfolio SSOT/audit absent (this pass creates them) |
| Market / packaging surface | 5% | 2/5 | Zap/VPS guides, SUE release scripts; many `private: true`; OpenClaw Proprietary; no portfolio storefront |
| **Total** | **100%** | **68/100** | **→ 68% complete** |

---

## STAGED Evidence Map (SRC-IDs)

Trees batched as logical **SRC-IDs**. Full recursive inventory not performed.

| SRC-ID | Path (batch) | Role (from docs) | Sampled evidence | Staged finding |
|--------|----------------|------------------|------------------|----------------|
| **SRC-ROOT** | `README.md` | Portfolio umbrella | Read | Title `hcc-portfolio-production`; one-line scope (SUE, BaaS, SaaS, Ziggurat) |
| **SRC-STRAW** | `hcc-straw/` | STRAW stack + desktop/web | README, `straw-app/package.json`, `+page.svelte`, `apps/web/README.md` | Desktop: Svelte 5 + Tauri 2 + WASM; real flow/AI UI. Nested `apps/web` claims AUTARCH/Next/Postgres — stack drift vs root STRAW tagline |
| **SRC-SAAS** | `hcc-straw-saas/` | Local-first SaaS generator | README, `core/controller.py`, `core/config.json` v1.3.0, `Cargo.toml` workspace, sample `lib.rs` | Working Python generator; 9 templates; 30+ Rust components — quality uneven (`uptime_monitor` mock vs `auth_system` JWT) |
| **SRC-BAAS** | `hcc-straw-baas/` | HOLO-9 SQLite-first BaaS | README, root `package.json`, 11× `packages/*/index.ts`, `REMAINING_SERVICES_REFACTORING.md` | **5 complete** (auth/data/billing/storage/analytics) with SQLite; **6 stubs** (gateway/workflow/integration/delivery/core/hosting) |
| **SRC-SUE** | `hcc-straw-sue/` | Sovereign Unified Extension + ecosystem | `SUE/SUE/README.md`, `package.json` v5.0.0, 4 manifests, `ecosystem/README.md` + 7 packages | Marketable browser-extension product surface; ecosystem suite claimed production-ready (not re-verified runtime) |
| **SRC-RAMBLOX** | `hcc-straw-ramblox/` | Roblox gamedev platform | README, `package.json` v2.0.0 | Next 15 + R3F + better-sqlite3; README still mentions Supabase (**doc drift**) |
| **SRC-FRAMEWORK** | `hcc-framework/` | PowerShell solo-dev toolchain | README | Documented PS7 module + Cheapname deploy; separate product from STRAW runtime |
| **SRC-OPENCLAW** | `openclaw-integration/` | Scraping/automation kit | README, `package.json` v1.0.0 | “Installation Ready”; Express/Puppeteer stack; Proprietary license |
| **SRC-FDA** | `hcc-fda/` | FDA / Radix compliance | README, nested `RadixLabsApp/package.json` | Feature-rich docs; Quick Start path `Radix_App/RadixLabsApp` vs observed `hcc-rams/RadixLabsApp` (**path drift**) |
| **SRC-SCRIV** | `scrivfactory/` | Scrivener 3 template factory | README, `pyproject.toml` `0.2.0b1` | Beta CLI with tests; usable developer tool; tree bloated by `.venv-beta` |
| **SRC-MANTLE** | `hcc-mantle/` | Northstar flooring platform | Flooring README v1.0.0 | Claims production-ready Node/React/SQLite microservices |
| **SRC-PHARMA** | `hcc-pharma-web/` | Radix Labs web | `package.json` v1.0.0 | Vite+tsx server, Vitest, Drizzle — parallel web surface to FDA tree |

**Method notes (Tier 0 / STAGED):**
- Entry points, manifests, and primary READMEs sampled; component trees summarized by SRC-ID.
- `cargo` / `pnpm` / `pip` / browser-load **not executed** this pass.
- File-count claim (~32k) treated as operator estimate; large contribution expected from `scrivfactory/.venv-beta` and caches.

---

## Completed

- [x] Portfolio identity declared at root (SUE + BaaS + SaaS + Ziggurat)
- [x] HOLO-9 BaaS: five SQLite-backed microservices with migrations + shared cache/storage modules (per README + auth-service source)
- [x] SaaS generator controller with template/component listing and output manifests
- [x] SUE MV3 extension packaging scripts, multi-browser manifests, WASM build scripts, documented test matrix
- [x] STRAW desktop app with flow canvas / NLP / codegen UI (Svelte sources present)
- [x] Scrivfactory beta CLI package metadata + FDA/novel/etc. templates (docs)
- [x] Vertical/domain apps present: Ramblox, Mantle flooring, FDA/Radix, Pharma web, OpenClaw integration, Hammurabi Framework
- [x] Deployment literature for Zap Hosting / Ziggurat (SUE + BaaS docs)
- [x] Tier 0 STAGED audit + SSOT authored (`PROJECT-STATUS-AUDIT.md`, `SSOT.md`)

---

## Current State

`hcc-straw` is a **Hammurabi Coding Company production portfolio folder**, not a single binary. Docs position the marketable core as:

1. **SUE** — Manifest V3 sovereign AI sidebar (v5.0.0) plus a multi-app ecosystem.
2. **HOLO-9 BaaS** — local-first multi-tenant backend (5 solid services, 6 stubs).
3. **STRAW SaaS generator** — assemble vertical SaaS bundles from Rust/component folders.
4. **Supporting SKUs** — STRAW desktop stack, Scrivfactory β, Ramblox, Mantle, FDA/Radix/Pharma, OpenClaw, Framework.

Relative to “marketable/usable product,” several **individual** products approach usability; the **portfolio as one sellable unit** lacks unified versioning, licensing, install path, and quality bar. STAGED score: **68%** (`T3-PORTFOLIO-PARTIAL`).

---

## Gaps

1. **No portfolio-level product SKU** — root does not ship one installer, version, or store listing
2. **HOLO-9 incomplete** — 6/11 services stubbed (gateway through hosting) per `REMAINING_SERVICES_REFACTORING.md`
3. **SaaS component depth uneven** — generator works; many crates are mocks/stubs while catalog lists 40+ components
4. **Sovereignty / stack conflict** — SQLite-local claims alongside Postgres/Redis/Supabase/S3/Stripe/Next surfaces
5. **Doc path drift** — FDA Quick Start path; Ramblox Supabase vs SQLite deps
6. **Tree bloat** — `scrivfactory/.venv-beta` and caches dominate size; hurts auditability and packaging
7. **Ecosystem verification gap** — SUE ecosystem README claims production-ready suite; STAGED pass did not prove each app
8. **Auth hygiene (BaaS)** — auth-service uses SHA-256 password hash + default JWT secret in sampled code (not production-grade crypto)
9. **Prior SSOT absent** — portfolio lacked canonical UD until this audit
10. **Runtime evidence missing** — builds/tests/servers not executed in Tier 0 STAGED mode

---

## Bugs / Defects (evidence-gated)

| ID | Severity | Evidence | Description |
|----|----------|----------|-------------|
| BUG-01 | High | `REMAINING_SERVICES_REFACTORING.md` + `gateway-service/index.ts` | Gateway (and 5 peers) echo/stub only — platform cannot claim full BaaS mesh |
| BUG-02 | Medium | `hcc-fda/README.md` Quick Start vs glob `hcc-rams/RadixLabsApp` | Documented `cd` path likely wrong for this tree layout |
| BUG-03 | Medium | `hcc-straw-ramblox/README.md` vs `package.json` deps | README lists Supabase; deps use `better-sqlite3` |
| BUG-04 | Medium | `auth-service/index.ts` (sampled) | SHA-256 password hashing + fallback JWT secret — unsafe if deployed as-is |
| BUG-05 | Low | `uptime_monitor/src/lib.rs` (sample of SaaS depth) | Mock always-true uptime; catalog implies real ops component |
| BUG-06 | Low | Root `README.md` | One-line identity only — operators lack portfolio map (mitigated by this audit/SSOT) |

*(Compile/runtime failures not asserted without executing toolchains — see Unverified.)*

---

## Priority Queue (Top 5)

1. **Pick a flagship SKU for market claim** — recommend **SUE v5** (loadable extension) or **Scrivfactory β** (CLI) as first public ship; freeze portfolio marketing until chosen
2. **Finish HOLO-9 gateway + core orchestration** — unblocks honest “BaaS platform” positioning
3. **Grade SaaS components** — mark mock vs production in `config.json` / README; stop implying all 40+ are shippable
4. **Purge/archive vendored venvs** — remove `.venv-beta` from product tree; document install-only workflow
5. **Normalize stack story** — either local-first SQLite sovereignty **or** cloud Postgres/Redis — document exemptions per SRC-ID in SSOT Phase 3

---

## Unverified

| Item | Why unverified |
|------|----------------|
| Exact file count (~32k) | Full recursive count timed out / not completed in STAGED mode |
| `pnpm package` / Playwright for SUE | Docs claim pass; not re-run |
| HOLO-9 service curl matrix | Not executed |
| SaaS `controller.py --all` generation | Not executed |
| Tauri desktop build for straw-app | Not executed |
| Scrivfactory wheel install smoke | Not executed |
| Mantle / FDA / Ramblox / Pharma runtime | Docs + manifests only |
| Parent-repo CI outside this folder | Out of scope |

---

## Return Summary (for parent rollup)

| Field | Value |
|-------|-------|
| **Maturity** | Tier 3 — Partial Production Portfolio (`T3-PORTFOLIO-PARTIAL`) |
| **% Complete** | **68%** |
| **Audit path** | `C:\IEDB\external\BSM-C\hcc-straw\PROJECT-STATUS-AUDIT.md` |
| **SSOT path** | `C:\IEDB\external\BSM-C\hcc-straw\SSOT.md` |
| **UD-ID** | `UD-20260719-hcc-straw` |
