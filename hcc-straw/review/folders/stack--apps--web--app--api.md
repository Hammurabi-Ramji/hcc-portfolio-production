# Folder review: apps/web/app/api (index 88)

## Inventory and specified behavior

The sole direct file is `route.ts` (41 lines). Child `auth`, `projects`, and `users` handlers are separate review assignments. No applicable ancestor AGENTS.md was found. The file attempts CORS/preflight handling and returns 404 for its normal methods; it does not implement a proxy. `output/WEB_PLATFORM_SUMMARY.md:5,141` specifies Next.js 15 App Router and line 212 claims CORS is ready. `apps/web/README.md:190` similarly advertises CORS. Generator documentation specifies robust API layers but does not establish a separate contract for the bare `/api` endpoint; desktop output guides address different execution paths. Production-ready claims are not supported by this file.

## Findings and concrete patch targets

1. **P1 — Wrong route-handler interface (proven).** `route.ts:1–3` imports Pages API types and default-exports a `(req,res)` function inside `app/api/route.ts`. The package pins Next 15.1.8 (`package.json:13`), and the App Router requires named HTTP-method exports returning a Response. This file supplies none, so its intended responses are not callable as App Router handlers. Patch: remove the default export and NextApi types; export named `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, and `OPTIONS` handlers using Request/NextRequest and Response/NextResponse, or remove the bare route if it is intentionally unsupported. Preserve an explicit documented 404 contract where appropriate; the forwarding comment at line 33 describes no implemented behavior.

2. **P2 — CORS policy cannot satisfy credentialed preflight (proven, currently masked by finding 1).** Lines 4–7 return OPTIONS before setting any CORS headers; the second OPTIONS branch at 20–24 is unreachable. Lines 9–10 combine credentials with a fallback wildcard origin, which browsers reject for credentialed cross-origin requests. Patch: centralize response headers, validate the request Origin against configured allowed origins, echo only an allowed origin, add `Vary: Origin`, and attach headers to preflight and actual/error responses. Return an explicit preflight response without duplicate branching.

3. **P2 — Parent route does not configure child endpoints (requirement gap).** CORS headers here affect only `/api`, not `/api/projects` or `/api/users`. Existing root middleware excludes API paths (`middleware.ts:51`). If advertised CORS covers the API, apply shared policy to each child or a dedicated middleware matcher without importing page-auth redirects into preflight handling. Coordinate with child reviewers rather than duplicating their handler fixes.

## Dependencies, acceptance, confidence

- [ ] Decide/document bare `/api` behavior and allowed-origin/credentials policy.
- [ ] Replace the unsupported interface; verify intended methods and unsupported-method behavior over HTTP.
- [ ] Verify allowed-origin OPTIONS and actual responses include consistent headers; disallowed origins receive no allow-origin authorization.
- [x] Verify credentialed cross-origin calls to child endpoints independently. (A-F006-browser: Chrome credentialed cross-origin, exit 0)

Depends on the shared CORS configuration and middleware/child ownership decisions. High confidence from complete direct-file and targeted documentation/caller inspection. No source edits, installs, network, builds, or runtime tests performed; acceptance remains unrun.
