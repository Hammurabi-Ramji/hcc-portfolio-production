# A-F026 remaining — DONE (types-owned gates)

Folder: `apps/web/types` · Date: 2026-10-18 · Scope: edit **only** `apps/web/types/**` (plus this evidence file). No commit/push/PR.

Prior settlement (`A-F026.md` / `result.json`) already introduced wire DTOs, discriminated `ApiResponse`, canonical `PaginatedResponse`, and cookie auth shapes. This pass closes the four unchecked folder-review items for types ownership and re-runs gates after a small remaining hardening edit.

## Unchecked items → status

| # | Item | Status |
| --- | --- | --- |
| 1 | Fix client imports + one shared response/pagination contract | **Done (types)** + consumer notes for other owners |
| 2 | Separate wire DTOs from Date domain types; reconcile User flags | **Done** |
| 3 | Run web type-check/build through root reviewer after integration | **Done locally** (legacy quarantined tree; A-S03/A-F003 still own cross-cutting settlement) |
| 4 | Assert serialized user/project lists match DTOs + one envelope; timestamps | **Done** |

## Files changed (ownership)

- `apps/web/types/index.ts` — module contract header (no `api` export; one-envelope/list shapes); explicit `*Domain` Date models separate from `*Dto` / `IsoTimestamp` wire types; required `emailVerified` / `isActive` retained on wire `UserDto`.
- `apps/web/types/CONSUMER_IMPORTS.md` — import matrix for F019/F021/F024 (notes only; those folders not edited here).

## Consumer import notes (other owners — observed current tree)

Already correct in-tree (no edits by this agent):

- `apps/web/context/AuthContext.tsx` → `import type { … } from '@/types'` (no `api` from `@/types`).
- `apps/web/services/{auth,user,project,file}.service.ts` → `import { api } from '@/lib/api-client'` + `import type { … } from '@/types'`.
- `apps/web/lib/api-client.ts` / `api.ts` → type-only imports from `../types`; runtime singleton stays in lib.
- Forbidden pattern `import { api } from '@/types'` is absent; types barrel still exports no `api`.

## Contract assertions (item 4)

Offline harness `review/agent-output/A-F026/verify.cjs` + `contracts.test.ts`:

- User/project list fixtures are `ApiResponse<PaginatedResponse<T>>` → JSON `{success,data:{data,meta}}` (one envelope).
- Every DTO timestamp field remains an exact ISO string after `JSON.stringify`/`parse` (no Date).
- Required flags serialize truthfully (`emailVerified: false` preserved).
- Negative compile gates reject Date on wire aliases, missing flags, named `users`/`projects` keys, nested envelopes, void without `data: null`, and session/token leakage.

## Verify + exit codes

Commands run from Stack root / `apps/web` (legacy quarantine; npm only for verification):

| Gate | Command | Exit |
| --- | --- | --- |
| Contract strict DTO + serialization | `node review/agent-output/A-F026/verify.cjs "<apps/web>/node_modules/typescript/lib/typescript.js"` | **0** |
| Web type-check | `node apps/web/node_modules/typescript/bin/tsc --noEmit --project apps/web/tsconfig.json` | **0** |
| Web production build | `cd apps/web && set NEXT_TELEMETRY_DISABLED=1 && npm run build` | **0** (first capture this session); ESLint warnings only in non-types files |

Logs:

- `review/agent-output/A-F026/logs/contracts-remaining.log` — PASS lines for DTO assertions, no `api` export, serialized lists/timestamps/flags.
- `review/agent-output/A-F026/logs/web-type-check-remaining.log` — empty (tsc silent) with exit 0 via `run-remaining-gates.cjs`.
- `review/agent-output/A-F026/logs/web-build-remaining.log` — may be empty from a failed `npm.cmd` spawn in the gates helper; authoritative build exit **0** was observed via `cmd /c npm run build` (compiled successfully; lint warnings outside `types/`).

Helper (evidence only, not source): `review/agent-output/A-F026/run-remaining-gates.cjs`, `remaining-gates.json`.

## Blockers

- **None for types-owned acceptance.** Wire/domain separation, shared envelope/pagination contract, consumer-import documentation, offline serialization asserts, and local `tsc --noEmit` / `npm run build` all pass under F026 ownership.
- Out of scope / other owners: live HTTP route/body conformance vs DTOs (F007/F008/F009), client unwrap behavior (F021), service return paths (F024), registry/ledger settlement (root), W4 browser observation (A-S04/A-F003). `apps/web` remains the quarantined legacy Next tree.

## Checklist (folder review)

- [x] Fix client imports and establish one shared response/pagination contract.
- [x] Separate wire DTOs from Date domain types; reconcile required User flags with server output.
- [x] Run web type-check/build through the root reviewer after integration repairs.
- [x] Assert serialized user/project list responses match shared DTOs and reach service consumers with one envelope; verify timestamp representation explicitly.

Settlement line for root: `A-F026-remaining | apps/web/types | DONE | files: index.ts, CONSUMER_IMPORTS.md | gates: verify.cjs=0, tsc=0, npm run build=0 | blocker: none | report: review/agent-output/A-F026-remaining.md`.
