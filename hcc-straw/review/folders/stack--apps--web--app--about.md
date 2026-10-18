# Folder review: apps/web/app/about

Inventory: inspected the only direct file, `page.tsx` (117 lines), in full. It implements a public About route with mission, technology, values, company attribution, shared Navbar and Footer. No applicable ancestor AGENTS.md was present. Scope is this route; shared implementations were read only for integration evidence.

Specified versus current: `apps/web/SETUP_GUIDE.md:15-16,105-106` explicitly lists this page, and Navbar links to `/about` on desktop and mobile (`components/Navbar.tsx:47,133`). The route supplies the advertised informational sections and its frontend versions agree with `apps/web/package.json:13-15,30-31`. Generator framework documentation describes a separate Svelte/Axum desktop-first framework (`docs/EXPANDED_SAAS_FRAMEWORK.md:9-10,40`), so it is not evidence that this Next.js route has those integrations.

## Findings and concrete patch targets

- **P2, proven navigation state bug:** `page.tsx:11` always passes `user={null}`. Navbar consequently displays Login/Sign Up and hides Dashboard for an authenticated visitor (`Navbar.tsx:53-93,139-179`). The imported `useAuth` at line 4 is never called. Patch `AboutPage` to read the authenticated user and pass the same display-name/avatar mapping used in `app/dashboard/page.tsx:47`; remove unused `Link` at line 3. **Dependency:** first integrate AuthProvider in the root layout: `app/layout.tsx:22-25` currently renders children without it, and `AuthContext.tsx:160-164` throws without a provider. Calling the hook alone would introduce a crash. Session restoration also belongs to the context reviewer (`AuthContext.tsx:33-39`).
- **P2, documentation/content requirement gap:** `page.tsx:46-70,83` presents backend/security capabilities and comprehensive production testing as delivered facts. The platform's own setup guide instead lists connecting the real backend and adding PostgreSQL/Redis as next steps (`SETUP_GUIDE.md:350-353`); `output/WEB_PLATFORM_SUMMARY.md:164` also leaves backend integration unchecked. Patch these sections to distinguish implemented frontend capabilities from planned integrations and replace the blanket production-ready/testing claim with evidence-backed wording. This is a claim substantiation issue, not proof that each named security feature is absent everywhere.

## Acceptance and remaining tasks

- [ ] Coordinate provider/session work, then map the real user into About Navbar; remove the unused Link import.
- [ ] Reconcile technology/security/testing copy with implemented platform evidence.
- [ ] Verify `/about` anonymously and after login on desktop/mobile: content visible, correct auth actions, no provider exception; run the root's normal build/type checks after coordinated changes.

Confidence: high for constant guest navigation and provider dependency; medium for capability claim completeness. Static inspection only; no source edits, installs, network access, browser checks, or tests performed. Generator readiness reports were considered claims, not runtime verification.
