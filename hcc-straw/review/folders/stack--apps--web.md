# Review 085 — apps/web direct files

Scope: all 18 direct files inspected: `.env.example`, `.env.local` (keys only; values never emitted), `.eslintrc.js`, `.gitignore`, `.prettierrc`, five Markdown guides, `middleware.ts`, three JavaScript build/style configs, `package.json`, `package-lock.json`, `tsconfig.json`, and `tsconfig.tsbuildinfo`. Lockfile inspection covered root dependency parity and required-package presence; build-info inspection covered compiler/version/diagnostic metadata rather than dumping generated cache. Nested folders have separate reviewers. No applicable ancestor AGENTS.md was found.

## Current versus specified behavior

The package establishes Next 15.1.8/React 19, strict TypeScript, standalone output, and Tailwind 3. README.md:3 and SETUP_GUIDE.md:5 describe production readiness, Express/PostgreSQL/Redis, authentication, and executable setup commands. These are historical implementation claims, not current acceptance evidence. Stack README identifies a desktop Svelte/Tauri/Rust/Axum/WASM stack; generator docs describe modular sovereign components and customizable UI shells. The web platform is a separate integration boundary. `output/WEB_PLATFORM_SUMMARY.md:154` lists follow-up work. Current saved `review/web-type-check.log` records 19 errors.

## Findings and patch targets

1. **P1 — package/type build blockers (proven).** `middleware.ts:1–3` uses unimported `NextRequest`; `package.json:12–24` omits `@hookform/resolvers` used at login/page.tsx:8 and signup/page.tsx:8. The lockfile also omits it; both faults appear in the saved compiler log. Patch the import and declare a resolver release compatible with React Hook Form 7/Zod 3, then regenerate the lockfile. Other compiler failures belong to child reports and remain acceptance dependencies.

2. **P1 — middleware authentication contract fails (proven).** `middleware.ts:4,29` requires a cookie while `context/AuthContext.tsx:66,96` stores login/register tokens only in localStorage. Thus the eventual successful login redirect at login/page.tsx:43 is rejected by server middleware. Any nonempty forged cookie also passes this guard. API checking at middleware.ts:16–25 is unreachable because matcher line 51 excludes `api`; JWT validation is TODO. Patch around one server-validated session contract with login/logout cookie issuance, expiry/signature checks, explicit public auth exemptions, and API authorization in handlers or matching middleware. Do not merely include every API path and thereby block login.

3. **P2 — lint configuration cannot load its declared plugin (proven manifest/lock mismatch).** `.eslintrc.js:24–28` references `react-refresh`, absent from package.json and lockfile. Remove the refresh-only rule/plugin from this Next package or declare it explicitly; prefer a coherent Next/TypeScript lint configuration and validate ESLint 9 compatibility. Runtime lint was not rerun.

4. **P2 — Tailwind misses authored JSX (proven configuration gap).** `tailwind.config.js:2–5` scans app/components/pages but excludes hooks. `hooks/useToast.tsx:69–94` owns classes including solid success/error/warning backgrounds absent from scanned source. Add hooks to content globs so those utilities are emitted. Actual toast mounting is owned by the hooks/app reviewers.

5. **P2 — onboarding commands and environment contract are stale (proven).** README.md:20 copies nonexistent `apps/.env.example`; README.md:24–28 invokes nonexistent root package scripts. Package.json has no `format`, Docker, or database scripts despite README.md:122–132/QUICK_START.md:95. `.env.example:17` supplies `APP_URL`, while utils/config.ts:2 reads `NEXT_PUBLIC_APP_URL`. ARCHITECTURE.md:48 and SETUP_GUIDE.md:41 advertise backend/endpoints with no apps/api, auth handlers, or health/files routes. Preserve readiness text as a dated snapshot and prepend current limitations; make quick-start commands package-local, document the actual backend requirement, and align the public URL variable.

## Concrete minimal diff seeds

```diff
-import { NextResponse } from 'next/server';
+import { NextResponse, type NextRequest } from 'next/server';
```

```diff
     './components/**/*.{js,ts,jsx,tsx,mdx}',
+    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
```

## Dependencies and acceptance

- [ ] Resolve child compiler errors plus manifest/import blockers; clean type-check and production build.
- [ ] Choose session/backend ownership; exercise login, refresh, logout, expired/forged cookie, protected page, and protected/public API requests.
- [ ] Repair lint dependency/configuration; run package lint successfully.
- [ ] Inspect built toast CSS for all four variants.
- [ ] Follow corrected quick start from a clean checkout; verify declared commands and URL configuration.

High confidence in static findings and saved compiler evidence. No source edits, installs, network, broad tests, or build reruns. PostCSS module loading, standalone deployment, remote image policy, and live session behavior remain unrun checks.

