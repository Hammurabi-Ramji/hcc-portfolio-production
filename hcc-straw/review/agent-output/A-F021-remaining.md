# A-F021 remaining — DONE (with out-of-folder build blocker)

Folder: `C:\IEDB\STRAW Stack\apps\web\lib`. Date: 2026-10-18.
Exclusive edits under `apps/web/lib/**` only. No commit/push/PR.
Quarantined legacy tree: `apps/web`.

Assigned unchecked items from `review/folders/stack--apps--web--lib.md`:

1. Repair one envelope contract and all consumer imports; rerun web type-check/build — **for imports outside lib/, document required changes for F019/F024/F026**.
2. Document API origin and supply implemented endpoints before claiming web authentication works.

## Verdict

**Done** for lib-owned remaining acceptance, with one documented integration blocker: full `next build` fails outside `lib/` (`/_document` PageNotFoundError). Envelope contract was already correct from prior A-F021; this pass publishes the durable contract file, consumer-import requirements, origin/endpoint inventory, and re-runs verification.

**Does not claim** browser cookie authentication or live Rust endpoint success.

## Lib changes

| File | Change |
| --- | --- |
| `apps/web/lib/API_CONTRACT.md` | **New.** Origin, envelope, proxied endpoints, F019/F024/F026 import requirements. |
| `apps/web/lib/api-client.ts` | Pointer comment to `API_CONTRACT.md`. Envelope unchanged (one unwrap). |
| `apps/web/lib/backend-proxy.ts` | Pointer comment to `API_CONTRACT.md`. |
| `apps/web/lib/utils.ts` | Debounce type-position rest params renamed `_args` to clear Next lint unused-var warnings. |

Unchanged (already correct): `api.ts` re-export singleton; cookie same-origin client; `zod-form-resolver.ts`.

## Envelope (confirmed)

- Success interceptor returns AxiosResponse unchanged.
- `get/post/put/patch/delete/upload` return `response.data` once as `ApiResponse<T>`.
- `api.ts` re-exports the same `api` / `ApiClient`.
- No localStorage / Bearer injection on the supported client.

## Consumer imports documented for F019 / F024 / F026

Published in `apps/web/lib/API_CONTRACT.md`:

| Owner | Required |
| --- | --- |
| **F026** `types` | Own wire `ApiResponse`/DTOs; type-only barrel; no runtime `api` from `@/types`. |
| **F024** `services` | `import { api } from '@/lib/api-client'`; return envelope unchanged; paths relative to `/api`. |
| **F019** `context` | No `api` from `@/types`; use `AuthService`; cookie/`/auth/me` session; no Bearer in storage. |

**Observed 2026-10-18:** services and AuthContext already match these imports. Lib did not edit those folders.

## API origin and endpoints

Documented in `API_CONTRACT.md`:

- Browser: same-origin `/api`, `withCredentials: true`.
- Proxy: `http://127.0.0.1:${STRAW_API_PORT\|\|3001}`; `STRAW_WEB_ORIGIN` default `http://localhost:3000`.
- Auth / users / projects proxy paths listed; email recovery may be truthful `501`; file/avatar unsupported locally.
- Explicit: do not claim web auth works until owners observe live cookie round-trips.

## Verification (exit codes)

| Step | Command | Exit |
| --- | --- | --- |
| Lib strict compile | `node apps/web/node_modules/typescript/bin/tsc …` (types + all lib modules) | **0** |
| Offline regressions | `node --test review/agent-output/A-F021/regression.cjs` | **0** (8 pass / 0 fail) |
| Web type-check | `npm run type-check` in `apps/web` | **0** |
| Web build | `npm run build` in `apps/web` | **1** |

Logs: `review/agent-output/A-F021-remaining/logs/{01-lib-tsc,02-regression,03-web-type-check,04-web-build}.log`.

`py` / `python` unavailable on this host (`VERIFY_EXIT` 112 / 9009); equivalent node commands were run instead of `review/agent-output/A-F021/verify.py`.

## Blockers

1. **`npm run build` exit 1** — after successful compile + type validity, Next fails collecting page data: `PageNotFoundError: Cannot find module for page: /_document`. Outside `apps/web/lib`; belongs to app/Next owners (e.g. A-S03 / A-F003), not this folder.
2. **No claim of live authentication** — contract documents origin/endpoints only; Rust cookie session observation remains F007/W4.
3. **Python launcher missing** — cannot re-run historical `verify.py` wrapper; node equivalents used.

## Settlement line

`A-F021-remaining | apps/web/lib | DONE | API_CONTRACT.md + pointer comments + debounce lint | lib tsc 0 + 8 regressions 0 + web type-check 0 | blocker: next build /_document (outside lib) | review/agent-output/A-F021-remaining.md`
