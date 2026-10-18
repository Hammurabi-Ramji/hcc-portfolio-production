# Folder review: apps/web/app/api/users (index 90)

## Inventory and required behavior

The sole direct file is `route.ts` (147 lines): GET searches/paginates two seeded users; POST accepts account fields and inserts a user. No nested route files exist here. No applicable ancestor AGENTS.md was found. Reviewed root README, web README/setup guide, desktop README, output WEB_PLATFORM_SUMMARY, and relevant generator requirements/verification sections. The web guide advertises user management and production readiness, but acknowledges a real backend/database remains to be connected (SETUP_GUIDE.md:351–352). This folder is demonstrably a mock, not production account management. Needed behavior includes verified admin access, persistent shared accounts, validated input, and a consistent client contract.

## Evidence-backed findings and patch targets

1. **P1 — User listing and creation lack server authorization.** `route.ts:29–30,82–84` enter handlers without authenticating or checking roles. GET exposes email, username, role and timestamps (`55–65`); POST can mutate the store. Integration evidence: `middleware.ts:51` excludes API paths, so its cookie branch never protects this endpoint; even that branch leaves JWT verification as a TODO (`24`). `services/user.service.ts:133` explicitly labels listing “admin only.” Patch: call a shared verified-session helper before both handlers, return 401 without valid credentials and 403 for non-admin management operations. If public registration is desired, put it behind an explicitly separate registration policy rather than silently treating user management as public.

2. **P1 — Account creation reports success without durable credentials or storage.** `route.ts:3–27` uses an isolated module Map; `85,116–125` require a password but omit it entirely from storage. A 201 therefore does not create an authenticatable persisted account. Restarts lose additions, and separate instances have independent lists. `115` also uses millisecond IDs, permitting overwrites when creations share a timestamp. Patch: implement a shared account repository with database-generated/UUID IDs, password hashing, and transactional unique normalized email/username constraints; return only public fields. Requires integration with the intended auth implementation and database, neither of which this handler currently imports.

3. **P2 — Truthiness validation admits data that breaks later listing.** `85–87` accepts truthy objects/numbers for email and username; `118–125` stores them. A later GET with search invokes `.toLowerCase()` on those values (`42–43`), resulting in 500 and making search fail for every caller. Invalid JSON is also reported as internal failure (`84,134–144`). Patch: validate a strict body schema before mutation, normalize email, enforce reasonable field/password bounds, and return 400 for malformed JSON/schema failures. Existing zod dependency can support this.

4. **P2 — Pagination accepts invalid numeric values.** `32–33,49–53` allow zero, negatives, nonnumeric strings and partial numbers. `limit=0` yields no items and nonfinite pages (serialized as null); negative values apply unintended slice semantics. Patch: require full positive integers, cap limit, and return 400 for invalid inputs.

5. **P2 — Returned list shape disagrees with the declared consumer.** `58` returns `{users,meta}`, while `types/index.ts:100–107` requires `{data:T[],meta}` and `services/user.service.ts:137–145` declares that contract. Returned users also omit required `emailVerified` and `isActive` (`types/index.ts:7–8`). Patch: align the endpoint DTO and service types, using one shared validated response definition; verify JSON date handling intentionally.

## Acceptance and confidence

- [ ] Verify anonymous/forged/expired credentials receive 401; regular users receive 403; authorized admins succeed.
- [ ] Create then authenticate an account; verify it survives restart and is visible across instances; verify duplicate and concurrent creation cannot overwrite records.
- [ ] Reject malformed JSON, nonstring fields and invalid pagination with 400; search remains healthy afterward.
- [ ] Confirm returned list/User DTOs match consumers with real JSON responses.

High confidence in the source findings. No source changes, installs, network calls, builds or runtime tests were performed; root owns broad checks. Client import and middleware compilation defects are outside this folder's ownership and do not constitute working authorization.
