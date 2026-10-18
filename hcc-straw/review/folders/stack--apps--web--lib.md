# Folder review 101 — apps/web/lib

Reviewed all direct files: `api-client.ts` (186 lines), `api.ts` (57), and `utils.ts` (173). The folder supplies two Axios implementations and class, formatting, storage, and authentication helpers. `cn` is used by login/signup; neither API implementation currently has a working source import. Applicable ancestor AGENTS.md files were absent. Dependencies axios, clsx, and tailwind-merge are declared in `apps/web/package.json`; strict TypeScript includes these files.

The web README and SETUP_GUIDE specify working authentication, CRUD, upload, and standardized responses. `output/WEB_PLATFORM_SUMMARY.md:92` describes the API client as complete, but line 164 still requires connecting a real backend. Generator docs describe desktop-first Rust/Axum components; they do not establish an implemented service for these web clients. Production-ready claims are unsupported here.

## Prioritized findings and patch targets

1. **P1 — Proven response contract and build failure.** `api-client.ts:58` unwraps AxiosResponse into the API envelope; `:101,115,129,143,153,172` then return that envelope's `data` again. A successful `{success:true,data:{accessToken,user},meta:...}` becomes `{accessToken,user}`, losing success/error/meta and breaking the login caller's `response.success` check (`context/AuthContext.tsx:61`). Requests without payload return undefined. Saved `review/web-type-check.log:17–25` confirms the incompatible interceptor plus six generic return errors. Patch the success interceptor to return its AxiosResponse unchanged and request `ApiResponse<T>` in every method, returning `response.data` exactly once. Preserve public envelope types in one shared definition.

2. **P1 — Proven integration blocker.** Consumers bypass this folder: `context/AuthContext.tsx:4` imports nonexistent `api` from `@/types`; all four service files import nonexistent `./api` at line 1. The same saved log reports these import failures. Replace imports with the repaired named export from `@/lib/api-client`; service methods must return its envelope directly instead of wrapping it again (e.g. `auth.service.ts:15–19`). Retire or re-export `api.ts` with the same contract. Its current success interceptor also unwraps data while retaining Axios's default response typing (`api.ts:27–29`), and its unguarded localStorage/window usage (`:15,34–35`) would fail if used from server code.

3. **P2 — Proven incompatible token representations, currently dormant helper path.** `utils.ts:162–164` JSON-stringifies a token, whereas both clients read raw storage (`api-client.ts:85`, `api.ts:15`) and AuthContext writes raw storage (`:66,96`). Using setAuthToken causes a quoted Bearer token; reading a normal JWT through getAuthToken/isAuthenticated fails JSON parsing (`utils.ts:117–122,147,156`). Use a single raw-string token adapter across helpers, client, and context, guarded for browser availability and storage errors.

4. **P2 — Proven helper edge-case failure, no current caller.** `utils.ts:16–20` merges dateStyle/timeStyle defaults with arbitrary Intl options; passing `{year:'numeric'}` mixes incompatible options and throws. Select style defaults only when explicit component options are absent. Also define validation for invalid dates and nonfinite/negative byte sizes (`:88–96`) before exposing these helpers broadly.

API origin selection (`api-client.ts:32–34`, `api.ts:5`) needs an explicit deployment decision: both default to port 3001 while existing Next routes live under the web app and authentication route files are absent. This is an integration requirement gap, not proof that every configured external server fails. Upload configuration (`api-client.ts:167–170`) should merge supplied headers rather than replace them.

## Acceptance and confidence

- [ ] Repair one envelope contract and all consumer imports; rerun web type-check/build.
- [ ] Verify login, empty response, pagination metadata, structured HTTP error, and network error retain the chosen contract.
- [ ] Verify token round trips produce identical raw Bearer values and server requests never access browser globals.
- [ ] Verify upload preserves caller headers; test explicit date components and invalid utility inputs.
- [ ] Document API origin and supply implemented endpoints before claiming web authentication works.

High confidence in static findings and saved compiler evidence. No source modified, tests/build rerun, installation, or network access performed; backend, browser, and upload behavior remain unrun.
