# Folder review: apps/web/app/features

Inventory: inspected the only direct file, `page.tsx` (29 lines), plus shared Navbar/Features/Footer, layout, authentication context, package manifest, middleware, representative users API, root README, and targeted generator/output documentation. No applicable ancestor AGENTS.md was found.

Current versus specified: the route renders a heading, description, shared eight-card feature grid, and footer. This meets the basic feature-showcase page listed in `output/WEB_PLATFORM_SUMMARY.md:77-83`. Generator documentation describes desktop-first STRAW components and UI shells; its completion claims do not establish production readiness for this separate Next.js application. The route itself implements no advertised backend capability.

Findings and concrete patch targets:

- **P2 — Unsupported capability presentation (integration requirement gap).** `page.tsx:23` publishes shared claims including PostgreSQL/Redis, JWT/RBAC/bcrypt, Turborepo, production Docker, and audit tracking (`components/Features.tsx:15-45`). The web manifest has no database, Redis, JWT, bcrypt, or Turbo dependencies; the sampled users API explicitly uses an in-memory mock (`app/api/users/route.ts:3-4`), and middleware leaves JWT validation TODO (`middleware.ts:24-25`). The implementation summary itself lists real backend and Docker configuration as unfinished (`output/WEB_PLATFORM_SUMMARY.md:163-169`). Patch the shared Features descriptions to distinguish implemented Next.js/TypeScript UI from planned backend/infrastructure capabilities, then keep this route rendering that corrected source. Do not treat dependencies alone as proof that external services cannot exist; none of the inspected integration establishes those advertised guarantees.
- **P3 — Navigation always presents guest state (proven local behavior).** `page.tsx:10` passes `user={null}`. Navbar chooses login/signup versus dashboard/profile exclusively from that prop (`components/Navbar.tsx:53-93,139-179`), so authenticated visitors receive guest navigation here. Patch the page to consume `useAuth()` and map the user into Navbar's name/avatar shape after authentication state is available. This depends on app-level AuthProvider wiring and session restoration: `app/layout.tsx:24` currently renders children directly, while `context/AuthContext.tsx:33-39` leaves restoration unimplemented. Coordinate with those owners; this is presentation correctness, not an authorization bypass.

Acceptance: load `/features` anonymously and with a restored session on desktop/mobile; confirm guest/account navigation and feature copy match actual supported capabilities. Run the root-owned Next build/type check after integration fixes. Confidence is high for the route and prop behavior, moderate for capability completeness beyond inspected boundaries. No source edits, network, installs, builds, or tests were run.

- [ ] Correct shared capability copy and document planned integrations.
- [ ] Wire session-aware Navbar after provider/session repairs.
- [ ] Verify route rendering, mobile navigation, and build/type checks.
