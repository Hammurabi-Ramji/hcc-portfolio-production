# Review: apps/web/app/docs

Reviewed every direct file: `page.tsx` (317 lines), the sole owned file. No applicable AGENTS.md was found in the workspace/ancestor chain checked. Targeted integration reads covered the web manifest, AuthContext, auth service/client, web README/setup guide, output web summary, and the three required generator documentation files. No source changes or tests were run.

## Current versus specified

This route renders introductory documentation, quick-start steps, architecture/authentication descriptions, and Docker commands. `output/WEB_PLATFORM_SUMMARY.md:82,220-222` identifies it as the documentation with a table of contents and the central help destination. It therefore needs accurate runnable instructions and working links. The generator's desktop-first STRAW scope (`docs/README.md:3`) and its production-grade assertions (`docs/FINAL_VERIFICATION_REPORT.md:7,41`) do not establish that this separate Next.js web application has a deployed backend.

## Findings and concrete patch targets

1. **P1 — Shipped instructions describe infrastructure absent from this checkout.** `page.tsx:175-183,225-239,273-283` claims Express/PostgreSQL/Redis, a Turborepo monorepo with `apps/api` and shared packages, and production-ready Docker services. The root inventory has only `apps/web`, no root package.json, packages directory, or Turborepo/Compose/Docker manifests; the web manifest (`apps/web/package.json:5-35`) contains Next.js/frontend scripts and packages. Running the advertised `docker-compose up -d` cannot provision this application from these files. The output guide itself lists connecting a real backend, implementing email, CI and Docker as remaining work (`output/WEB_PLATFORM_SUMMARY.md:163-169`). **Patch:** replace lines 175-183 and 225-239 with the actual Next.js app layout and an explicit externally supplied API prerequisite; replace Docker commands with a pending deployment section until checked-in manifests exist. Qualify the production-ready introduction at lines 126 and 163-165 accordingly. This is a proven documentation mismatch, not a demand to introduce an entire backend in this folder.

2. **P1 — Authentication promises exceed implementation evidence.** `page.tsx:252-260` asserts token refresh, verification/reset, RBAC, sessions and auditing as implemented. `apps/web/app/api/auth` is empty; `AuthContext.tsx:33-39` comments out token validation/user restoration, and `auth.service.ts:94-156` merely calls external endpoints. **Patch:** describe the supplied frontend/service contracts and mark each backend capability as requiring implementation/verification. Link the API configuration instructions to the actual `NEXT_PUBLIC_API_URL` contract (`lib/api-client.ts:32-34`). Do not present wrappers as proof of server behavior.

3. **P2 — Most table-of-contents links have no destination.** The 24 sidebar entries (`page.tsx:8-69`) have only five matching content sections: introduction, quick-start, architecture, authentication and docker. Nineteen entries, including Installation/API Design/Deployment, point to missing IDs. The two “Learn More” cards also use `href="#"` (`293,302`). On mobile the sidebar is hidden (`93`), while “Table of Contents” (`81-87`) leads only to four quick links, omitting Quick Start. **Patch:** derive a shared section/navigation collection containing only implemented IDs, render it for mobile as well, and add actual reference sections or remove the placeholder cards. Remove unused `activeSection` state (`72`) and its import if navigation remains static.

## Dependencies and acceptance

Documentation correction is local; truthful claims depend on the API/auth and deployment owners supplying executable evidence. Navigation requires no new package. High confidence in static mismatches; runtime rendering, build and browser accessibility checks were not run under the review scope.

- [ ] Correct stack/layout/deployment claims and specify `cd apps/web` before commands.
- [ ] Identify authentication capabilities as contracts or verified implementations.
- [ ] Ensure every visible fragment link resolves and provide the same TOC on mobile.
- [ ] From a clean checkout, follow revised instructions; confirm all advertised prerequisites exist and all cards navigate to real content.
