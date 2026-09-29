# Sovereign SSOT — hcc-straw

| Field | Value |
|-------|-------|
| **UD-ID** | `UD-20260719-hcc-straw` |
| **Canonical path** | `C:\IEDB\external\BSM-C\hcc-straw` |
| **SSOT date** | 2026-07-19 |
| **Classification** | Tier 3 partial production portfolio (multi-SKU) |
| **Authority** | This file is the Single Source of Truth for this UD-ID until amended or superseded |
| **Companion audit** | `PROJECT-STATUS-AUDIT.md` |
| **Audit mode** | STAGED (entrypoint/doc/manifest sampling; SRC-ID tree batches) |

---

## Identity

| Attribute | Status |
|-----------|--------|
| Portfolio name | **HCC Portfolio Production** (`hcc-portfolio-production` per root README) |
| Folder codename | `hcc-straw` |
| Flagship products (doc-inferred) | **SUE** (browser extension), **HOLO-9 BaaS**, **STRAW SaaS Generator**, STRAW desktop stack, plus vertical SKUs |
| Versions (sampled) | SUE `5.0.0`; SaaS gen `1.3.0`; BaaS `0.1.0`; Scrivfactory `0.2.0b1`; Ramblox `2.0.0`; straw-app `0.1.0` |
| Owner | Hammurabi Coding Company (per product READMEs / package metadata) |
| Marketable product | **Partial** — individual SKUs approach marketability; portfolio-as-one-SKU **No** (**68%**) |

---

## Phase 1 — Intent & Problem

| Item | Status | Statement |
|------|--------|-----------|
| Problem statement | STATED (docs) | Need a sovereign, local-first HCC production estate: AI browser workspace (SUE), SQLite BaaS (HOLO-9), SaaS assembly (STRAW), desktop STRAW stack, and deployable Ziggurat/VPS paths |
| Target user | PARTIAL | Solo HCC operators, SaaS builders, FDA/compliance authors (Scrivfactory), vertical operators (Mantle/Ramblox/Radix) — inferred from READMEs; no single buyer persona file |
| Success definition | OPEN | At least one flagship SKU publicly installable with honest “what works” docs + verified tests; BaaS mesh not marketed as complete until gateway/core done |
| Non-goals (current) | STATED | Not a single AUTARCH IDE binary; not one monorepo npm workspace at root |
| Decision | OPEN | Name **one** market flagship (recommend SUE or Scrivfactory) vs continue multi-SKU portfolio without unified packaging |

**Gate:** Lock flagship SKU + stack sovereignty exemptions (Phase 3) before expanding new verticals.

---

## Phase 2 — Scope & MVP

| Item | Status |
|------|--------|
| In-scope (declared portfolio) | SUE extension, BaaS platform, SaaS framework, Ziggurat VPS (root README) |
| In-scope (observed trees) | SRC-STRAW, SRC-SAAS, SRC-BAAS, SRC-SUE, SRC-RAMBLOX, SRC-FRAMEWORK, SRC-OPENCLAW, SRC-FDA, SRC-SCRIV, SRC-MANTLE, SRC-PHARMA |
| Out-of-scope (today as portfolio) | Unified store listing, single license/pricing page, AUTARCH V10.0 full binding |
| MVP checklist | See below |
| Acceptance criteria | See Exit criteria (Phase 8) |

### MVP checklist (evidence-gated) — portfolio level

- [ ] Flagship SKU chosen and version-pinned in this SSOT
- [ ] Flagship “Quick Start” verified on a clean machine (runtime evidence attached)
- [ ] HOLO-9: real gateway proxy **or** docs demote BaaS to “core 5 services”
- [ ] SaaS generator: component catalog distinguishes `production` / `stub` / `mock`
- [ ] Remove or `.gitignore` vendored `.venv-beta` / heavy caches from product tree
- [ ] LICENSE map per SRC-ID (MIT vs Proprietary vs missing)
- [ ] Portfolio root README expanded to SRC-ID map (or keep this SSOT as map)

### Per-flagship MVP (candidates)

| Candidate | MVP bar |
|-----------|---------|
| SUE | `pnpm package` → load unpacked; unit+e2e green; release zip path documented |
| Scrivfactory | `pip install` wheel → `scrivfactory create` produces openable `.scriv` |
| HOLO-9 | Auth+Data vertical slice behind real gateway; JWT secret + password hashing hardened |
| STRAW app | Tauri build runs flow list/create end-to-end |

---

## Phase 3 — Architecture & Stack

| Item | Status |
|------|--------|
| Runtime (mixed) | Browser MV3; Node/Hono microservices; Python CLI; Tauri/Svelte desktop; Next.js apps; PowerShell framework |
| Declared portfolio stack | STRAW-oriented + HOLO-9 SQLite-first + SUE WASM — **LOCKED as intent for this UD-ID** |
| AUTARCH V10.0 binding | **NOT BOUND portfolio-wide** — multiple JS/cloud-touching surfaces present |
| Forbidden deps (TERMINUS) | Several SRC-IDs use React/Next/Postgres/Redis/Puppeteer — treat as **explicit exemptions** unless migrated |
| Interfaces / APIs | BaaS ports 3001–3005 (+ stubs); SUE local API / native host; SaaS generator CLI; product-specific REST |
| Data store | Intended local-first SQLite (HOLO-9, Scrivfactory, parts of STRAW); also Postgres/Redis in SUE ecosystem & FDA docs |

```
hcc-straw/  (portfolio)
├── hcc-straw-sue/     → MV3 + WASM + ecosystem apps
├── hcc-straw-baas/    → HOLO-9 (5 live / 6 stub)
├── hcc-straw-saas/    → Python controller + Rust components + templates
├── hcc-straw/         → STRAW desktop (Tauri/Svelte) + apps/web (Next claim)
├── scrivfactory/      → Python CLI (β)
├── hcc-fda / hcc-pharma-web / hcc-mantle / hcc-straw-ramblox
├── hcc-framework/     → PowerShell toolchain
└── openclaw-integration/
```

**Sovereignty note:** Market claims of “sovereign / zero external deps” apply **only** where evidenced (e.g., HOLO-9 core services). Do not extend to entire portfolio without Phase 3 amendment.

### Stack exemptions (STAGED register)

| SRC-ID | Exemption | Notes |
|--------|-----------|-------|
| SRC-SUE ecosystem | Postgres/Redis/Next/Expo | Cloud suite alongside local-first extension |
| SRC-STRAW `apps/web` | Next + PostgreSQL | Diverges from Svelte/Tauri STRAW tagline |
| SRC-SAAS | Stripe/S3/Redis/Posthog/etc. components | Generator may emit non-sovereign stacks |
| SRC-OPENCLAW | Puppeteer/pg/redis | Automation kit |
| SRC-FDA / SRC-PHARMA | Next/Postgres patterns | Compliance platforms |

---

## Phase 4 — Repository Layout

| Path | Role | Present? |
|------|------|----------|
| `PROJECT-STATUS-AUDIT.md` | Tier 0 status audit | Yes (this pass) |
| `SSOT.md` | This document | Yes (this pass) |
| `README.md` | Portfolio one-liner | Yes (thin) |
| `hcc-straw/` | STRAW stack + straw-app + apps/web | Yes |
| `hcc-straw-saas/` | SaaS generator | Yes |
| `hcc-straw-baas/` | HOLO-9 BaaS | Yes |
| `hcc-straw-sue/` | SUE + ecosystem | Yes |
| `hcc-straw-ramblox/` | Ramblox | Yes |
| `hcc-framework/` | Dev framework | Yes |
| `openclaw-integration/` | OpenClaw kit | Yes |
| `hcc-fda/` | FDA / Radix | Yes |
| `scrivfactory/` | Scrivener factory | Yes (+ `.venv-beta` bloat) |
| `hcc-mantle/` | Flooring platform | Yes |
| `hcc-pharma-web/` | Pharma/Radix web | Yes |
| Portfolio CI / unified LICENSE | Automation / legal | **Not observed at root** |

**Authoritative SRC-ID summary tree:**

```
hcc-straw/
├── PROJECT-STATUS-AUDIT.md
├── SSOT.md
├── README.md
├── hcc-straw/                 # SRC-STRAW
├── hcc-straw-saas/            # SRC-SAAS
├── hcc-straw-baas/            # SRC-BAAS
├── hcc-straw-sue/             # SRC-SUE
├── hcc-straw-ramblox/         # SRC-RAMBLOX
├── hcc-framework/             # SRC-FRAMEWORK
├── openclaw-integration/      # SRC-OPENCLAW
├── hcc-fda/                   # SRC-FDA
├── scrivfactory/              # SRC-SCRIV
├── hcc-mantle/                # SRC-MANTLE
└── hcc-pharma-web/            # SRC-PHARMA
```

---

## Phase 5 — Build, Run, Verify

| Capability | Status | Evidence |
|------------|--------|----------|
| Install (SUE) | Scripted | `pnpm install` + `pnpm package` (README) |
| Install (BaaS) | Scripted | `pnpm install`; per-service `node packages/*/index.ts` |
| Install (SaaS gen) | Scripted | `python core/controller.py --help` / templates |
| Install (Scrivfactory) | Scripted | `pip install -e .` / wheel `0.2.0b1` |
| Install (STRAW app) | Scripted | `vite` / `tauri` scripts in `straw-app/package.json` |
| Test (SUE) | Documented green | README matrix unit 4/4 + e2e 18/18 — **not re-run** |
| Test (Scrivfactory) | Declared | pytest in optional-deps; beta focus |
| Portfolio unified test | Absent | No root test orchestrator observed |
| Deploy docs | Present | Zap Hosting / Ziggurat scripts in SUE + BaaS |

**Runtime verification of the above commands: NOT EXECUTED in this Tier 0 STAGED audit** (see companion audit Unverified).

---

## Phase 6 — Security & Sovereignty

| Control | Status |
|---------|--------|
| Secrets in tree | Per-product `.env.example` patterns; default JWT secret in BaaS auth sample — **unsafe default** |
| Network surface | Local microservice ports; browser extension; optional VPS (Zap) |
| AuthN / AuthZ | Implemented in HOLO-9 auth + various apps; quality uneven (SHA-256 passwords sampled) |
| Crypto / Krypt.DB | Not portfolio-standard; SQLite/file stores dominate local-first claims |
| Local-first posture | Strongest in HOLO-9 core + SUE defaults; contradicted by cloud ecosystem packages |
| Threat model | Deferred per SKU; portfolio-level threat model **OPEN** |
| Sovereignty | Mixed — document exemptions; do not market whole folder as AUTARCH V10.0 |

---

## Phase 7 — Delivery & Marketability

| Item | Status |
|------|--------|
| License | Mixed (MIT on SUE/straw-app/scrivfactory; OpenClaw Proprietary; many private packages) |
| Pricing / packaging | Absent at portfolio root; SUE release scripts exist |
| Docs for users | Strong developer docs per SKU; weak portfolio map (until this SSOT) |
| Support / update path | Per-repo GitHub / Zap scripts in docs |
| Marketable / usable MVP? | **Partial — 68%** (multi-SKU; flagship not locked) |

### Marketability ranking (STAGED inference)

| Rank | SKU | Why |
|------|-----|-----|
| 1 | SUE v5 | Versioned, manifests, package scripts, documented tests, clear end-user load path |
| 2 | Scrivfactory β | Installable CLI, template factory, beta packaging path |
| 3 | HOLO-9 core 5 | Runnable BaaS services with testing/deploy guides; incomplete mesh |
| 4 | STRAW desktop | Real UI code; Tauri ship path; README still template-thin |
| 5+ | Verticals | Mantle/FDA/Ramblox/Pharma/OpenClaw/Framework — usable with more validation debt |

---

## Phase 8 — Roadmap & Exit Criteria

### Immediate (P0)

1. Amend Phase 2 with **chosen flagship SKU**
2. Honest BaaS marketing: complete gateway **or** scope to 5 services
3. Component maturity labels in SaaS generator
4. Remove vendored `.venv-beta` from tracked product surface
5. Expand root README to point at this SSOT + SRC-ID map
6. Harden HOLO-9 auth (bcrypt/argon2 + no default JWT secret) before any public deploy claim

### Exit criteria to leave Tier 3 Partial (reach T4 market-ready portfolio or T3-flagship)

- [ ] Rubric **≥80%** on re-audit with **executed** build/run evidence for flagship
- [ ] Flagship installable by a third party from docs alone
- [ ] BaaS stub status resolved or demoted in public docs
- [ ] License map complete; no contradictory “production-ready” claims on stubs
- [ ] Sovereignty exemptions registered or stacks migrated
- [ ] Portfolio file hygiene: no committed virtualenvs/caches as primary bulk

### Supersession

A future SSOT may replace this document only by recording a new UD-ID or an explicit amendment block referencing `UD-20260719-hcc-straw`.

---

## Evidence Pointers

| Claim | Pointer |
|-------|---------|
| Portfolio identity | `README.md` |
| BaaS 5 complete / 6 stub | `hcc-straw-baas/README.md`, `REMAINING_SERVICES_REFACTORING.md`, `packages/*/index.ts` |
| SaaS generator usable | `hcc-straw-saas/README.md`, `core/controller.py`, `core/config.json` |
| SUE v5 packaging | `hcc-straw-sue/SUE/SUE/package.json`, manifests, README |
| STRAW desktop UI | `hcc-straw/straw-app/src/routes/+page.svelte` |
| Scrivfactory beta | `scrivfactory/pyproject.toml`, README |
| Completeness | See `PROJECT-STATUS-AUDIT.md` → **68%** / `T3-PORTFOLIO-PARTIAL` |

---

## CONFIRMATION

```
UD-ID:           UD-20260719-hcc-straw
PATH:            C:\IEDB\external\BSM-C\hcc-straw
DATE:            2026-07-19
MATURITY:        Tier 3 — Partial Production Portfolio (T3-PORTFOLIO-PARTIAL)
PERCENT_COMPLETE: 68%
PRODUCT:         HCC Portfolio Production (multi-SKU; flagship not locked)
SSOT_STATUS:     ACTIVE
AUDIT_STATUS:    COMPLETE (filesystem Tier 0 STAGED; runtime builds unverified)
CONFIRMATION:    ACKNOWLEDGED — portfolio registered; choose flagship SKU and close BaaS/SaaS honesty gaps before market claim
```

**Confirmed by:** Staff Engineer Tier 0 STAGED audit process  
**Confirmation stamp:** `UD-20260719-hcc-straw` / `2026-07-19` / `68%` / `T3-PORTFOLIO-PARTIAL`

---

## AMENDMENT 1 — 2026-09-17 (references `UD-20260719-hcc-straw`)

| Field | Value |
|-------|-------|
| **Amendment UD-ID** | `UD-20260917-hcc-straw` |
| **Type** | FULL Tier-1 audit with executed builds (supersedes STAGED sampling; this SSOT's structure and UD-ID lineage remain authoritative) |
| **Audit pack** | `audit/2026-09-17/` → `FULL-AUDIT.md`, `SRC-ID-MAP.md`, `BUILD-VERIFICATION.md`, `REMEDIATION-BACKLOG.md`, `build-evidence/` |
| **Revised score** | **67%** (was 68% estimate) — confidence upgraded Medium → **High** |
| **Maturity** | `T3-PORTFOLIO-PARTIAL` held |

**Executed-verification updates to this SSOT:**

- Phase 5 runtime verification: **EXECUTED** for 8 of 11 SRC-IDs. Green: SUE (install + unit 4/4 + webpack bundle), Scrivfactory (install + pytest 12/12 + valid `.scriv` create), SaaS generator (43/9 listed; healthcare bundle generated), straw-app (vite build), Ramblox (next build + live serve), Pharma (tsc 0 errors + vite build + vitest 25/28). **Broken as shipped:** HOLO-9 BaaS (frozen lockfile, missing deps/imports/listeners), apps/web (missing deps, build fails), OpenClaw (require-time crash on every entrypoint). Env-blocked: all Rust/cargo targets, Playwright e2e, Pharma MySQL tests.
- Phase 6 security: **three Critical runtime-proven findings** — unsalted SHA-256 passwords + fallback JWT secret (BaaS), cross-tenant data access via spoofed `X-Tenant-ID` demonstrated live, JWT verify broken on hono@4.13; live secrets on disk in FDA/OpenClaw/Pharma `.env` files (rotation = P0).
- Phase 2 flagship: executed evidence strengthens the recommendation — **SUE v5.0.0** flagship, **Scrivfactory 0.2.0b1** runner-up. Decision still OPEN pending owner lock.
- Phase 7 marketability ranking: SUE (verified) > Scrivfactory (verified) > Ramblox/Pharma (verified builds) > STRAW desktop (frontend verified, Tauri blocked) > HOLO-9 (logic verified in sandbox, broken as shipped) > verticals.
- Corrections to Tier-0 claims: `scrivfactory/.venv-beta` is small (7.6 MB) and its interpreter still runs (stale metadata only); SUE e2e claim "18/18" is stale (40 cases on disk); SaaS docs' "no placeholders" is false (26/43 mock/stub); SUE ecosystem "7 apps" = 0 LOC.

**P0 actions (full list in `REMEDIATION-BACKLOG.md`):** rotate exposed secrets; lock flagship SKU; BaaS security floor + installability; fix OpenClaw entrypoint; retract false "production-ready/100% complete" docs.
