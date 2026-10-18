# Folder review: apps/web/app/api/projects (index 89)

## Inventory and intended behavior

The only direct file is `route.ts` (141 lines), implementing GET filtering/pagination and POST creation over two seeded projects in a module-level Map. No nested project routes exist. Applicable ancestor AGENTS.md files were checked; none were found. Read root README, web README/SETUP_GUIDE, relevant output web/desktop guide sections, and generator requirements/verification documentation. SETUP_GUIDE:237–243 promises project CRUD; web README:3 and SETUP_GUIDE:5 claim production readiness. Output WEB_PLATFORM_SUMMARY:163–164 instead leaves migrations and real backend connection outstanding. This implementation is a mock and does not substantiate production readiness or durable, authenticated project management.

## Prioritized findings and concrete patch targets

1. **P1 — Unauthenticated access and no owner isolation (proven).** `route.ts:31–40` returns every stored project without verifying a session or filtering by owner; `89–119` accepts creation without authentication and sets `createdBy: 'user1'` at line 116. `apps/web/middleware.ts:51` explicitly excludes `/api`, so its token-presence branch cannot protect this route; that branch also has JWT verification only as a TODO (24–25). Any caller can read/create projects, and real users would share records. Patch both handlers to call a shared server-side session verifier, return 401 for missing/invalid/expired credentials, derive creator identity from the verified session, and scope database reads by that identity or an explicitly authorized membership. Do not rely on the page redirect or client token storage.

2. **P1 — A successful creation is neither durable nor collision-safe (proven).** The Map at `route.ts:4` is process-local and seeded anew after restart; it is not shared across workers. `108` uses millisecond timestamps as IDs and `119` overwrites the matching Map key, so same-millisecond requests can lose a previously acknowledged project. Replace the mock Map with a repository backed by the chosen database, a unique key constraint, and UUID/database-generated IDs; migrate seeded data to explicit development fixtures. Return 201 only after committing the insert. Dependency: decide whether the web database is PostgreSQL as documented or an integrated local store; this route currently connects to neither.

3. **P1 — POST accepts values that break subsequent searches (proven).** `route.ts:94` checks only truthiness, accepting `{ "name": 7 }`; `119` saves it, then GET with `search` invokes `p.name.toLowerCase()` at `49`, producing a caught error/500. Non-string descriptions do the same at `50`; arbitrary statuses enter at `113`. Malformed JSON/null bodies also become 500. Use existing Zod dependency to validate an object, trim and bound a nonempty string name, validate optional string description and the documented four-value status enum, and return structured 400 responses for syntax/schema failures before mutation.

4. **P2 — Pagination and response contract are invalid (proven).** `route.ts:34–35` permits zero, negative, NaN and partially numeric inputs; `56–60` then yields invalid metadata or misleading slices (limit zero yields nonfinite pages serialized as null). Require positive safe integers, reject malformed inputs, and cap limit. `65` emits `data.projects`, while `types/index.ts:100–107` defines `PaginatedResponse.data` as an array and the page reads `result.data.data` at `app/projects/page.tsx:36–37`. Agree on one typed envelope and adapt handler/service/page together; the service additionally imports a missing `./api` module, an integration dependency owned by its folder review.

5. **P2 — Documented per-project CRUD is absent (requirement gap).** No `[projectId]` directory exists despite SETUP_GUIDE:126,241–243 and service calls at `project.service.ts:57,102,123`. Add owner-checked detail/update/delete handlers using the same repository or reduce the advertised contract. Archive/activate service methods also need a supported route or removal.

## Acceptance and confidence

- [ ] Reject anonymous, forged and expired sessions; verify two users cannot list each other's projects.
- [ ] Create concurrently, restart and exercise two workers; all committed projects remain distinct and readable.
- [ ] Reject malformed bodies/types/statuses and invalid pagination with 400; verify valid search and finite metadata.
- [ ] Verify actual HTTP list/create responses through the repaired service/page; exercise detail/update/delete ownership checks.

High confidence from complete direct-file and integration inspection. No source edits, installs, network requests, builds or runtime tests were performed; acceptance checks remain unrun and belong to root verification.
