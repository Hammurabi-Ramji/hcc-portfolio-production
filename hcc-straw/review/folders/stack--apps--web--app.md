# Folder review: apps/web/app (index 86)

## Inventory and specified behavior

Inspected every direct file with numbered lines: `globals.css` (127 lines), `layout.tsx` (28), and `page.tsx` (87). Child routes are separately owned; their imports were checked only for integration. No applicable AGENTS.md was present in checked ancestors. Stack README identifies the desktop stack; generator docs/README.md describes desktop-first modular applications, EXPANDED_SAAS_FRAMEWORK.md:9,35 distinguishes UI shells, and FINAL_VERIFICATION_REPORT.md:7 claims no placeholders. The relevant web specification is output/WEB_PLATFORM_SUMMARY.md:63-75: global authentication, responsive Tailwind UI, dark/light styling, and animations. Those claims exceed this root's wiring.

## Evidence-backed findings and concrete patch targets

1. **P1 — Global stylesheet is never loaded.** `layout.tsx:1-28` has no CSS import, and a targeted web-source search finds no import of `globals.css`. Consequently the sole Tailwind directives (`globals.css:1-3`), body colors, layout utilities, text gradient and animations are disconnected from all routes. Add `import './globals.css'` to `layout.tsx`. Verify generated CSS after resolving any adjacent PostCSS configuration problems; importing the file alone does not prove the pipeline works.

2. **P1 — Auth consumers have no provider.** `layout.tsx:23-25` renders children directly. `login/page.tsx:23`, `signup/page.tsx:35`, `dashboard/page.tsx:23`, and settings/projects call `useAuth`; `context/AuthContext.tsx:162-163` explicitly throws without its provider. Mount the client `AuthProvider` at the root. Coordinate with the context owner: its nonexistent `api` import must be repaired before mounting it. Detailed session and API defects belong to `stack--apps--web--context.md`.

Minimal root integration patch, after that dependency is repaired:

```diff
 import type { Metadata } from 'next'
+import './globals.css'
+import { AuthProvider } from '@/context/AuthContext'
@@
-        {children}
+        <AuthProvider>{children}</AuthProvider>
```

3. **P2 — Semantic color utilities are undefined even after CSS loading.** The landing page uses `bg-primary` with white text (`page.tsx:29,74`), `bg-secondary` (`:35`), `text-muted-foreground` (`:22,44,69`), and `bg-card`/`border-border` (`:64`). Adjacent `tailwind.config.js:9-12` defines only background/foreground, and `globals.css:5-14` defines only those two variables. Missing utilities leave the primary white CTA text on the light background. Define primary, secondary, muted-foreground, card, and border tokens for both schemes in `globals.css`, and map them in Tailwind configuration using a color format supporting `/90` opacity classes. This is a coordinated config patch, not a child-page change.

`page.tsx:11` also hardcodes anonymous navigation. Once auth works, pass context user to Navbar so returning users can reach Dashboard; this is a behavior improvement consistent with global auth, rather than a new authentication security boundary.

## Dependencies, acceptance and confidence

- [x] Load CSS and mount the repaired provider in the root layout.
- [x] Define/map semantic tokens; check computed CTA background and readable foreground in light/dark modes.
- [x] Render home, login, signup, dashboard and settings without provider exceptions; confirm responsive spacing, gradient, and navigation.
- [x] Connect homepage Navbar to hydrated user state and check anonymous/authenticated variants.

Acceptance checked after A-F004 verification (layout CSS+AuthProvider present; token/CTA contrast ≥4.5:1 light/dark; route provider coverage; homepage Navbar hydration mapping). Evidence: `review/agent-output/A-F004.md`. Live browser session cookie hydration remains an integration concern outside this folder. Unsupported marketing claims (`page.tsx:70`) were not treated as functional evidence.
