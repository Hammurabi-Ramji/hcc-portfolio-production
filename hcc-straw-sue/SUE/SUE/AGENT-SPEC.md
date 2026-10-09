# SUE Agent Specification

## Current audit note

This document reflects the repository state measured on **2026-05-18**. Do not assume that a successful package build means the full extension runtime is healthy.

## Repository layout

```text
C:\SUE\SUE
├── manifest.json
├── background.js
├── content.js
├── local-api-server.js
├── extension-api.js
├── webpack.config.js
├── package.json
├── tests\
├── sue-view\
└── sue-core\
```

## Versions

- `package.json`: `5.0.0`
- `manifest.json`: `5.0.0`
- `sue-view`: `5.0.0`
- workspace root / `sue-core`: `4.0.0`

Agents working in this repo should treat that as version drift, not intentional normalization.

## Verified command status

| Command | Result |
| --- | --- |
| `pnpm run package` | ✅ |
| `pnpm run typecheck` | ✅ |
| `pnpm run test:unit` | ✅ |
| `pnpm run test:e2e` | ✅ 18/18 pass |
| `pnpm run lint` | ✅ |
| `pnpm run format:check` | ✅ |
| `pnpm run check:wasm` | ✅ |

## Current notes

1. The E2E suite now retries or restores the local API if a bundled verification run hits a startup race.
2. `verify:local` and `check:wasm` are both part of the current green baseline.

## Runtime surfaces

- Local API base: `http://127.0.0.1:8080/api/v1`
- Ollama base: `http://127.0.0.1:11434`
- Main message families:
  - storage: `STORE_GET`, `STORE_SET`
  - auth/session: `AUTH_LOGIN`, `AUTH_LOGOUT`, `SESSION_GET`, `SESSION_REFRESH`
  - projects/notes: `PROJECT_*`, `NOTE_*`
  - tabs/page: `TAB_*`, `PAGE_*`
  - agents/memory: `AGENT_*`, `MEMORY_*`, `SUEWARM_*`

## Guidance for AI assistants

- Prefer `pnpm`, not `npm`, when following repository scripts.
- Treat `README.md`, `DEVELOPER-GUIDE.md`, `SUE-STATUS-REPORT.md`, and `SUE-UNIVERSAL-AUDIT-REPORT.md` as the current documentation baseline.
- If you are debugging page integration or content messaging, `content.js` and `tests\e2e\extension.spec.ts` are the primary surfaces.
