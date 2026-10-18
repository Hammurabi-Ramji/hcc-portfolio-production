# A-F024-remaining — DONE

Folder: `C:\IEDB\STRAW Stack\apps\web\services`. Exclusive services ownership for the two unchecked STACK-F024 gates. No commit/push/PR. `apps/web` outside `services/**` was not edited.

## Unchecked gates closed

1. **Verify every advertised route, profile persistence, authenticated ownership, pagination/search, and archive/activate effects.**
2. **Reconcile documentation with unsupported file/avatar storage; actual upload support is absent and must not be advertised.**

## Source changes (services only)

| File | Change |
| --- | --- |
| `apps/web/services/README.md` | **New.** Canonical supported Auth/User/Project paths; explicit unsupported storage section; forbids advertising upload/download success; notes no `/api/files/*`. |
| `apps/web/services/file.service.ts` | Comments clarify compatibility stubs / zero-transport UNSUPPORTED; no behavior change. |
| `apps/web/services/user.service.ts` | `uploadAvatar` comment forbids advertising avatar upload; still local 501, no transport. |

Behavior of supported methods unchanged. File/avatar still return typed `UNSUPPORTED` / 501 before any Axios call (preserves A-F024 offline gate).

## Verification

Driver: `node review/agent-output/A-F024-remaining/verify.cjs` (system `python` unavailable; Node verifier used). Existing `apps/api/target/debug/straw-web-api.exe` reused. Live harness points the real `@/lib/api-client` singleton at ephemeral loopback SQLite.

| # | Command | Exit |
| --- | --- | --- |
| 00 | docs-reconcile-services-readme | **0** |
| 01 | reuse straw-web-api.exe | **0** |
| 02 | `tsc --project review/agent-output/A-F024-remaining/tsconfig.json` | **0** |
| 03 | `node --test review/agent-output/A-F024-remaining/live-integration.cjs` | **0** (3/3) |
| 04 | `tsc --project review/agent-output/A-F024/tsconfig.json` | **0** |
| 05 | `node --test review/agent-output/A-F024/regression.cjs` | **0** (8/8) |
| 06 | scan-services-no-upload-advertising | **0** |

Live coverage through **AuthService / UserService / ProjectService** against real HTTP:

- Auth: register, login, me, refresh, logout, recovery 501s
- Profile update → API process restart → same cookie → fields persist; other user profile isolated
- Ownership: non-owner GET project → 403 FORBIDDEN; owner list/search pagination; admin `listUsers`/`searchUsers`; ordinary user list → 403
- Archive → status `archived`; non-owner activate → 403; owner activate → status `active`
- FileService + `uploadAvatar` → 501 with **zero** transport

Logs: `review/agent-output/A-F024-remaining/logs/`. Commands: `commands.json`. Result: `result.json`.

## Boundary / non-blockers

- `apps/web/SETUP_GUIDE.md` still lists `FileService - File upload/download` and `/api/files/*`; that file is outside services ownership (docs/F001/F003). Services-owned README does not advertise them.
- Full Next/browser page flows remain S04/F015/F016; this gate is the **service client path** against the live local API.

Settlement: `A-F024-remaining | apps/web/services | DONE | 3 files | docs reconcile + live 3/3 + prior offline 8/8 | blocker:none | review/agent-output/A-F024-remaining.md`.
