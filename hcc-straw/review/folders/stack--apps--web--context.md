# Folder review: apps/web/context (index 99)

## Inventory and expected behavior

The sole direct file, `AuthContext.tsx` (166 lines), defines a client React provider and hook, login/register/logout, local user updates, token persistence, and current-user refresh. All lines were inspected. No applicable AGENTS.md was found in the checked root/ancestor paths. Relevant generator documentation describes authentication/authorization and JWT management; web README:86-91 and output/WEB_PLATFORM_SUMMARY.md:66-67,211 claim JWT sessions, protected routes, and validation. Actual implementation below does not substantiate those completion claims. Desktop output guidance uses Tauri `invoke`; this context instead uses HTTP, and the registered desktop commands (`straw-app/src-tauri/src/lib.rs:104-118`) contain no auth commands. No desktop IPC bridge is implemented here; adding one is not assumed to be a requirement.

## Prioritized findings and patch targets

1. **P1 — Proven build blocker: nonexistent API export.** `AuthContext.tsx:4` imports `api` from `@/types`, but `types/index.ts:1-171` only contains types/error constants. The alias resolves to the web root (`tsconfig.json`). Split this import into type imports from `@/types` and a selected, consistently typed HTTP adapter. Do not simply substitute `lib/api-client.ts`: its response interceptor already returns the envelope at line 58, while methods read `.data` again at lines 101/115. Repair that adapter's unwrapping in the coordinated client change before adopting it.

2. **P1 — Proven integration blocker: provider is never mounted.** Repository TS/TSX/Svelte search finds `AuthProvider` only in this file. `app/layout.tsx:23-25` renders children directly, while login, signup, dashboard, settings, projects and permission hooks call `useAuth`. Consequently `AuthContext.tsx:162-163` throws. Wrap root-layout children with this client provider (or a client Providers component). This patch belongs to the layout owner's integration scope.

3. **P1 — Proven reload-session loss.** Initialization (`AuthContext.tsx:28-47`) loads only a token; validation and user hydration are commented out at lines 33-39. User remains null, so `isAuthenticated` at line 148 stays false on every reload even with a valid token. Replace the TODO with a real `/me` request, apply the user on success, clear both states on invalid/expired sessions, and finish loading in `finally`. Handle storage-read failures too: the current read occurs before any catch and can leave loading true.

4. **P1 — Proven inconsistent session transport.** Login/register only write localStorage (`:66,:96`), but middleware checks an `auth_token` cookie (`middleware.ts:4,29-36`); successful client login cannot satisfy a protected server navigation. Logout only clears localStorage (`:122`), leaving any existing cookie untouched. Coordinate a server-issued verified cookie/session contract and server-side logout with middleware and endpoints. The local `app/api/auth` directory contains no route files; SETUP_GUIDE's advertised login/register/logout/me handlers are a requirement gap. An external `NEXT_PUBLIC_API_URL` backend may supply them, but no such implementation was established by this review.

5. **P2 — Wrong refresh response type.** `:130` requests `ApiResponse<User>` as the payload generic and sets its data into `User` at `:132`. The selected envelope-returning client must instead use `get<User>` and return exactly one `ApiResponse<User>` envelope. Remove casts that hide mismatched responses from login/register and validate required token/user fields before accepting success.

## Acceptance and dependencies

- [ ] Fix import and shared client envelope contract; TypeScript check passes without auth casts masking errors.
- [ ] Mount provider; render each auth consumer without the missing-provider exception.
- [ ] Test login/register, protected navigation, reload restoration, invalid token, storage failure, refresh and logout against implemented backend endpoints.
- [ ] Assert middleware and client agree on session transport; logout invalidates the server session and refresh cannot retain an invalid user.

Confidence is high for static findings. No source edits, installs, network requests, builds, tests, or runtime/browser checks were performed. Backend endpoint implementation, shared client repair and middleware/layout ownership are dependencies; root build/test results must provide execution evidence.
