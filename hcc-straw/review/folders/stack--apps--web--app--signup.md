# Folder review: apps/web/app/signup

**Scope and inventory.** Reviewed the sole direct file, `page.tsx` (257 lines), completely. Inspected the root layout, auth context, types, service, API configuration, middleware, navigation references, package manifest/lockfile, and relevant guides for integration only. No applicable ancestor `AGENTS.md` was found. No source changes, installs, network access, or build/test commands were performed.

**Current versus specified.** The page implements username/email/password validation, password confirmation, required terms acceptance, visibility toggles, registration submission, error text, and a dashboard redirect. `output/WEB_PLATFORM_SUMMARY.md:63-68` and `apps/web/README.md:86-88` specify registration and JWT sessions; `SETUP_GUIDE.md:112-116` describes auth endpoints, while line 351 acknowledges the real API remains to be connected. Generator `docs/README.md:44` specifies authentication/JWT support; its expanded framework and final verification reports claim completed backend components, which do not establish this Next.js signup integration. Desktop output guides concern the separate Svelte/Tauri application. The web signup cannot currently meet its stated flow.

## Findings and concrete patch targets

1. **P1 — Build/render blockers in signup dependencies.** `page.tsx:8` imports `@hookform/resolvers/zod`, absent from `apps/web/package.json:12-35` and its lockfile. `page.tsx:35` calls `useAuth`, but `app/layout.tsx:23-25` renders children without `AuthProvider`; `context/AuthContext.tsx:162-164` explicitly throws for that state. The context also imports nonexistent `api` from `@/types` at line 4; `types/index.ts` exports no API client. Patch the manifest/lockfile to declare a compatible resolver, wrap children with the client provider in the root layout, and import a real client from `lib/api-client.ts` after agreeing its response contract. These are dependencies owned by adjacent reviews, not fixes inside the signup file alone. `services/auth.service.ts:1` likewise imports nonexistent `./api`; avoid routing signup through that service until corrected.

2. **P2 — Submission never enters the displayed pending state.** `page.tsx:43` reads only form errors and line 234 disables against context `isLoading`. Context loading only covers initialization (`AuthContext.tsx:23,47`); registration at lines 83-111 never changes it. Slow submissions leave the button enabled and show no pending text, allowing repeated registration requests. Patch the form destructuring to include React Hook Form `isSubmitting`, define `pending = isLoading || isSubmitting`, and use pending for both button disabling and its text at lines 234-237. Preserve re-enablement after errors.

3. **P2 — Consent links and controls are incomplete.** Links at `page.tsx:218,222` target absent `/terms` and `/privacy` routes. Visibility buttons at lines 155-165 and 192-202 have no accessible names; the checkbox at lines 211-225 has no associated label. Add actual policy pages or valid configured destinations, checkbox `id`/label `htmlFor`, changing toggle `aria-label`/`aria-pressed`, and field error IDs with `aria-describedby`/`aria-invalid`. Use an alert/live region for asynchronous registration errors (lines 84-88).

**Integration dependencies.** The local `app/api/auth` folder is empty; external API operation was not verified. `RegisterRequest` fields match submitted data. On successful registration the context stores only localStorage (`AuthContext.tsx:94-96`), whereas middleware checks a cookie (`middleware.ts:4,29-32`); the dashboard redirect at `page.tsx:61` therefore also depends on a consistent, server-established session contract. Backend ownership must supply registration validation and session issuance; client validation alone is insufficient evidence of those capabilities.

## Acceptance and tasks

- [ ] Restore resolver/client/provider dependencies; type-check and load `/signup` without import or provider errors.
- [ ] Reject invalid email, weak/mismatched passwords, and unchecked terms without sending requests.
- [ ] Hold a registration response pending; verify one submit request, pending text, and disabled submit; verify retry after rejection.
- [ ] Verify successful registration reaches dashboard and survives reload using the agreed session mechanism.
- [ ] Verify duplicate-account/network errors remain visible and keyboard/screen-reader controls and policy links work.

**Confidence:** High for source-backed defects; backend response/session behavior remains unverified. Acceptance checks above are proposed and unrun.
