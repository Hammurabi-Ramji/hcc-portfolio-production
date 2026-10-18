# Folder review: apps/web/app/dashboard (index 91)

## Inventory and current versus specified behavior

Reviewed every line of the sole direct file, `page.tsx` (238 lines), plus targeted auth context, types, Navbar, project/user service and root-layout integration. No applicable AGENTS.md was found in checked ancestors. The file supplies a responsive sidebar, account identity, logout, four metric cards, an activity feed and four quick-action buttons. `output/WEB_PLATFORM_SUMMARY.md:67,81,203` specifies a protected admin dashboard with sidebar and quick actions. Generator `docs/README.md:46` describes metrics tracking; its FINAL_VERIFICATION_REPORT:7-10 claims no placeholders and a functional Svelte admin dashboard, which is a different frontend and does not establish that this Next.js page works. Stack root README only identifies the desktop stack.

## Evidence-backed findings and patch targets

1. **P1 — Integration dependencies prevent dashboard rendering.** At `page.tsx:23`, `useAuth()` throws before rendering because `app/layout.tsx:23-25` renders children without AuthProvider and the hook explicitly throws in `context/AuthContext.tsx:162-163`. The context also imports nonexistent `api` from types (`:4`), confirmed by root's saved `review/web-type-check.log:15`. These belong to the layout/context owners; coordinate with `stack--apps--web--context.md`, rather than adding a private dashboard-only provider. Mount one shared provider and repair its API import/response contract first.

2. **P1 — Auth guard redirects during render and ignores initialization.** `page.tsx:27-29` calls `router.push` synchronously when unauthenticated. AuthContext starts loading with null user/token (`:21-23`), so an initial direct visit triggers navigation before session restoration. Even after hydration repair, this guard races it. Move navigation into an unconditional useEffect, consume `isLoading`, and display a loading state while initialization is pending. Prefer replace to avoid a back-button redirect loop. Context currently never restores the user (`:33-39`), a separate dependency, and middleware/session transport must also be repaired by its owner. This client guard alone is not server authorization.

3. **P2 — Sidebar links lead to absent routes.** `page.tsx:39-42` points at `/dashboard/users`, `/dashboard/projects`, `/dashboard/analytics`, and `/dashboard/settings`. Inventory confirms dashboard contains only page.tsx, with no child routes. Existing project/settings pages are `/projects` and `/settings`. Patch those two hrefs; implement authorized users/analytics screens before exposing those links, or omit unavailable entries.

4. **P2 — Promised quick actions and metrics are placeholders.** Buttons at `:215-230` have no handlers/links; clicks cannot create a project, add a user, view reports or open settings. Metrics at `:150-189` are constants and `:199-205` repeats the same fabricated activity five times without fetching any service. Wire New Project to the existing project creation flow and Settings to its route. Connect remaining actions and metrics to authorized, documented endpoints with loading/error/empty states, or explicitly label demo data and omit unavailable actions. Do not derive global admin totals from a single paginated list. This is a documented functionality gap, not evidence of an existing analytics backend.

5. **P2 — Mobile controls lack accessible names.** Icon-only close/open buttons (`:68-73,:124-129`) need aria-label; the opener should expose aria-expanded and aria-controls. Add Escape handling and focus restoration for the mobile drawer.

## Concrete patch shape, dependencies and acceptance

```diff
-import { useState } from 'react';
+import { useEffect, useState } from 'react';
-const { user, logout, isAuthenticated } = useAuth();
+const { user, logout, isAuthenticated, isLoading } = useAuth();
+useEffect(() => {
+  if (!isLoading && !isAuthenticated) router.replace('/login');
+}, [isLoading, isAuthenticated, router]);
-// synchronous router.push guard
+if (isLoading) return <p role="status">Loading dashboard...</p>;
+if (!isAuthenticated) return null;
```

Apply this before conditional returns, preserving hook order. Coordinate provider/session/client repairs and server authorization; project/user service imports currently reference absent `./api`, so metrics integration cannot assume usable adapters.

- [ ] Repair shared provider/client/session dependencies, then apply loading-aware effect guard.
- [ ] Correct reachable sidebar destinations and wire supported quick actions.
- [ ] Replace or disclose sample metrics/activity; verify loading, failure, empty and real-data states.
- [ ] Verify named mobile controls, keyboard close and focus restoration.
- [ ] Check authenticated direct load/reload, unauthenticated redirect, logout, every exposed link/action and mobile layout.

Confidence: high for static findings. No source changes, installs, network or runtime checks performed; root typecheck log inspected without repeating it. Browser rendering and backend behavior remain unrun.
