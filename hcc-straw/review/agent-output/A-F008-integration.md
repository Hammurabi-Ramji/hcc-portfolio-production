# A-F008 integration — projects Next proxy list/create + ownership

Status: **DONE** (scoped remaining acceptance). Folder: `apps/web/app/api/projects`.

Unchecked item closed: *Verify actual HTTP list/create responses through the repaired service/page; exercise detail/update/delete ownership checks.*

## Scope and ownership boundaries

- Edited production sources under `apps/web/app/api/projects/**`: **none**. The four thin Node proxies (collection, `[id]`, archive, activate) already forward to Rust via `proxyBackend` / `preflightResponse` and were left byte-unchanged.
- `apps/web/services/**` (STACK-F024) and `apps/web/app/projects/**` (STACK-F015) were **not** edited. Both already consume the canonical `/api` + `/projects` paths and `ApiResponse` / `PaginatedResponse` / `ProjectDto` contracts this gate exercised.
- Full browser visit, create-modal UX, Navbar, and page-level empty/error/retry states remain **F015**. Remaining “every advertised route / archive-activate effects through the service module” executable work remains the open F024 checklist items.

## Contract alignment (service/page, read-only)

| Consumer | Path / unwrap | Matches observed Next→Rust JSON |
|---|---|---|
| `project.service.ts` | `api.get/post/put/delete/patch('/projects'…)` with `baseURL: '/api'` | Yes — same `/api/projects…` routes |
| `service-utils.pagination` | default `page=1`, `limit=10`, cap 100 | Yes — backend defaults `page=1`, `limit=10`, `.min(100)` |
| `app/projects/page.tsx` | `result.data?.data` for cards; create via `projectApi.createProject` | Yes — list envelope `{ success, data: { data, meta } }`; create `{ success, data: ProjectDto }` |

## Verification

Exact commands, exit codes, and logs: `review/agent-output/A-F008/commands.json`.

| Gate | Exit | Log |
|---|---|---|
| Scoped `tsc` of projects + auth login/register routes | **0** | `A-F008/logs/typescript-compile.log` |
| `cargo test --test projects_http` (2/2) | **0** | `A-F008/logs/rust-projects-http.log` |
| Next compiled-handler HTTP regression (initial limit harness miss) | 1 | `A-F008/logs/next-http-initial-limit.log` (superseded) |
| Next compiled-handler HTTP regression final | **0** | `A-F008/logs/next-http-final.log` — **152 assertions** |

### What the Next HTTP gate proved

Against real loopback Rust/SQLite through the compiled App Router handlers (installed Next `autoImplementMethods` adapter; not a full `next dev`/browser session):

1. **List/create** — anonymous 401; authenticated empty list with finite `meta`; create returns 201 `ProjectDto` (`id`, `name`, `description`, `status`, `createdBy`, ISO `createdAt`/`updatedAt`); subsequent list returns one owned row in canonical pagination.
2. **Ownership** — other user: list total 0; GET/PUT/PATCH archive/activate/DELETE on owner’s id → 403 `FORBIDDEN`. Owner: GET/PUT/archive/activate/DELETE succeed; delete then GET → 404 `RESOURCE_NOT_FOUND`.
3. **Proxy hygiene** — exact-Origin CORS/credentials/`no-store`; per-route OPTIONS allow/deny; attacker Origin 403; unsupported methods 405; automatic HEAD on GET collection.
4. **ID validation** — malformed / encoded-slash / double-encoded traversal ids → 400 via item proxy.

Both test-owned servers stopped; isolated SQLite removed.

## Blockers

None for this remaining F008 item.

Downstream only (not blockers here): F015 browser/page acceptance; F024 remaining advertised-route/service-effect checklist; whole-tree source scan / release gates remain independently owned.

## Files changed

| Path | Change |
|---|---|
| `apps/web/app/api/projects/**` | **unchanged** |
| `review/agent-output/A-F008-integration.md` | this report |
| `review/agent-output/A-F008/**` | harness, tsconfig, commands.json, logs, compiled adapters (evidence only) |
