# Folder review: apps/web/app/projects

**Scope and inventory.** Reviewed the sole direct file, `page.tsx` (220 lines), completely with numbered lines. No nested project-detail folder exists. Checked ancestor instruction locations; no applicable AGENTS.md was found. Integration reads covered project service, API route, shared types, API client, auth provider/root layout, middleware, toast hook, Navbar, dashboard caller, package manifest, root/web README and relevant generator/output documentation. No source changes, installs, network calls, builds, or tests were performed.

**Current versus specified behavior.** The page provides status-colored cards and a create modal. The web README calls the foundation production-ready; output/IMPLEMENTATION_COMPLETE.md:118–123 promises API integration, loading states and error handling. Generator docs/FINAL_VERIFICATION_REPORT.md:7 asserts no placeholders, but those broad claims do not establish this page works. Needed behavior is authenticated entry, initial loading that completes, actual list/create results, visible failures, and usable project navigation. Generator expansion documents chiefly specify desktop-first modular SaaS; they do not explicitly require additional project CRUD screens.

## Findings and concrete patch targets

1. **P1 — Integration blockers prevent reaching the page.** `page.tsx:8` imports `project.service.ts`, whose line 1 imports nonexistent `./api`; only the four service files exist there. Point that service to the canonical `@/lib/api-client` and reconcile its return contract (see below). `page.tsx:21` calls `useAuth`, while `app/layout.tsx:22–25` renders children without `AuthProvider`; the hook explicitly throws without its provider (AuthContext.tsx:160–164). Add an application client-provider wrapper in the root layout. These dependency-owned defects must be fixed before page verification.

2. **P1 — Initial fetch never runs.** Loading starts true (`page.tsx:24`); `fetchProjects` is only invoked after successful creation (`:56`), with no mount/auth effect anywhere. Initial visits therefore display the spinner indefinitely. Import `useEffect`, invoke loading after auth initialization, and cancel/ignore stale responses when the component unmounts or the authenticated identity changes. Handle auth readiness consistently with the provider; middleware reads cookies while AuthContext writes localStorage (`middleware.ts:4`, AuthContext.tsx:66), another dependency-owned entry blocker.

3. **P1 — List payload is incompatible.** The page expects `result.data.data` (`:36–37`), matching PaginatedResponse (`types/index.ts:100–108`), but GET emits `{success:true,data:{projects:[...],meta}}` (`api/projects/route.ts:62–72`). The service additionally wraps its response (`project.service.ts:34–40`); api-client already strips the response envelope across interceptor/get (`:58`, `:101`). Select one envelope and collection field, correct the shared service/client/API types together, and consume it directly in this page. Do not merely add an effect: cards still cannot populate with the current contract.

4. **P2 — Failures and success notifications are invisible.** The service returns `success:false` rather than throwing (`project.service.ts:41–48`), but fetch handles only exceptions (`page.tsx:36–40`), silently presenting an empty list on failure. Add an explicit error branch/retry state. This page obtains only toast functions (`:22`); useToast stores notifications locally and requires its returned `toasts`/`removeToast` to be rendered by ToastContainer (`hooks/useToast.tsx:13,49–64`). Render that container or adopt a shared toast provider. Add pending-submit state and disable Create (`:199`) to prevent duplicate submissions.

5. **P2 — Navigation misrepresents available routes/session.** Card View links target nonexistent `/projects/[id]` (`:126`); dashboard points to nonexistent `/dashboard/projects` (`dashboard/page.tsx:40`). Implement the detail route/API as a separately owned feature or remove View pending delivery, and change the dashboard link to `/projects`. Pass an adapted authenticated Navbar user instead of hardcoded null (`page.tsx:77`); the User type has username/profile fields rather than Navbar's required name.

## Acceptance and tasks

- [ ] Repair provider, service import, auth persistence and one typed response contract.
- [ ] Verify initial authenticated visit renders seeded cards; empty and failed requests produce distinct states with retry and visible notification.
- [ ] Verify create adds exactly one project, refreshes cards, and reports validation/network failures visibly.
- [ ] Resolve View/dashboard links and authenticated Navbar display; add pending-submit protection.

Dependencies include shared API/auth/toast owners and project API/detail-route work. Acceptance should include type-check/build plus browser list/create/navigation checks after dependencies land. Confidence is high in static findings; runtime behavior and production backend/persistence were not exercised.
