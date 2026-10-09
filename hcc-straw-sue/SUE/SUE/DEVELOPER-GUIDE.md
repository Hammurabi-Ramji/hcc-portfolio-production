# SUE — Developer Guide

## Workspace

Project root: `C:\SUE\SUE`

Primary surfaces:

- `manifest.json` — MV3 manifest
- `background.js` — runtime/message router
- `content.js` — content script
- `local-api-server.js` — local HTTP API
- `sue-view\` — Leptos/WASM frontend
- `tests\unit` and `tests\e2e` — automated coverage

## Core commands

| Command | Current result | Purpose |
| --- | --- | --- |
| `pnpm run package` | ✅ | Build WASM and package `dist\` |
| `pnpm run typecheck` | ✅ | TypeScript validation |
| `pnpm run test:unit` | ✅ | Local API/unit coverage |
| `pnpm run test:e2e` | ✅ | Playwright extension suite |
| `pnpm run lint` | ✅ | ESLint clean |
| `pnpm run format:check` | ✅ | Prettier clean |
| `pnpm run check:wasm` | ✅ | Clippy clean on wasm target |
| `pnpm run validate` | ✅ | Full JS/TS validation |
| `pnpm run ci` | ✅ | Package + validate + tests |
| `pnpm run verify:local` | ✅ | Package + validate + tests + `check.js` |

## Local workflow

```powershell
Set-Location 'C:\SUE\SUE'
pnpm install
pnpm run package
pnpm run api
```

Optional:

```powershell
ollama serve
pnpm run test:unit
pnpm run test:e2e
```

## Current verification matrix

- **Green:** package, validate, typecheck, unit tests, Playwright E2E, wasm clippy, and local verification
- **Playwright coverage:** 18/18 passing checks across sidebar boot, dashboard, projects, notes, settings, tabs, cloud, API health, AI, auth, runtime bridge, and real content-tab messaging
- **Verification script:** `check.js` passes 29/29 checks
## Recommended confidence sequence

For a full local readiness check:

```powershell
pnpm run verify:local
pnpm run check:wasm
```
