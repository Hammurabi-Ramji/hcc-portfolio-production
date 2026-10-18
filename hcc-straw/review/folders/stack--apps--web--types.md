# apps/web/types — direct-file review

Reviewed `index.ts` in full (171 lines), the sole direct file. It defines User/Profile/Session, auth requests/tokens/state, API/error envelopes, pagination, file metadata, audit records, and error-code constants. No applicable ancestor AGENTS.md was found. Inspected targeted imports, HTTP clients, user/project routes, adjacent package/TypeScript manifests, root README, web README/setup guide, Stack output guides, and generator documentation. This is a static review; no source changes, builds, tests, installs, or network calls were performed.

## Current versus specified

The web guide identifies this folder as the shared type layer (`apps/web/SETUP_GUIDE.md:185–186`) and promises production-ready API/auth functionality (`:5`, `:41–45`). The definitions provide useful scaffolding, but do not currently describe the included HTTP contracts consistently. Generator production-completion statements (`docs/FINAL_VERIFICATION_REPORT.md:7`, `:41`) are not evidence that this separate Next.js app works. Root README describes the desktop STRAW stack; its Svelte/Tauri runtime types are outside this folder's ownership.

## Findings and patch targets

1. **P1 — proven integration compile blocker, consumer-owned:** `context/AuthContext.tsx:4` imports the runtime `api` from `@/types`, but `types/index.ts:1–171` exports no `api`. The actual class singleton is exported at `lib/api-client.ts:185`. Patch the consumer to import the client from its canonical implementation and use `import type` for these interfaces; do not add an HTTP dependency to the type barrel merely to satisfy the import. Services also import a nonexistent `./api` (`services/auth.service.ts:1`, likewise user/project/file); coordinate that repair with the services/client review. A successful type-layer repair depends on fixing the client's envelope handling, not just redirecting imports.

2. **P2 — proven wire/domain mismatch:** `User.createdAt/updatedAt` are Date (`index.ts:9–10`), while user route Date values (`app/api/users/route.ts:12–13`, `:121–122`) pass through `NextResponse.json` (`:55`, `:127`) as strings. Neither inspected Axios implementation hydrates dates. The same unsupported Date promise appears in Profile, Session, AuthTokens, and AuditLog (`index.ts:27–28`, `:36–39`, `:76`, `:132`); those endpoints were not available to verify. Introduce explicit JSON DTO timestamps as strings, or implement documented decoding before returning domain Date models. Also reconcile required `emailVerified/isActive` (`:7–8`) with user route objects, which omit both (`users/route.ts:7–14`, `:116–123`); return truthful fields rather than silently inventing verification status.

3. **P2 — proven list contract mismatch:** `PaginatedResponse<T>` requires `{data: T[], meta}` (`index.ts:100–108`), and services promise it (`user.service.ts:135–145`, `project.service.ts:30–40`), but routes emit `{success:true,data:{users,meta}}` and `{success:true,data:{projects,meta}}` (`users/route.ts:55–66`, `projects/route.ts:62–73`). Choose one canonical shape, type route outputs against it, and adapt existing callers. Coordinate with services to remove redundant wrapping/casts.

Optional hardening: replace default `any`/unbounded details with `unknown`, and model success/error as a discriminated union (`index.ts:43–57`). These are improvements, not independently demonstrated failures. AuthState is currently unused and differs from the context's refreshUser/updateUser surface; consolidate only after choosing the supported auth API.

## Dependencies and acceptance

Depends on the canonical HTTP client, API route owners, auth context, and services; no new package is necessary. Confidence is high for the demonstrated import and route-shape mismatches, limited for unused DTOs and absent backend endpoints.

- [ ] Fix client imports and establish one shared response/pagination contract.
- [ ] Separate wire DTOs from Date domain types; reconcile required User flags with server output.
- [ ] Run web type-check/build through the root reviewer after integration repairs.
- [ ] Assert serialized user/project list responses match shared DTOs and reach service consumers with one envelope; verify timestamp representation explicitly.
