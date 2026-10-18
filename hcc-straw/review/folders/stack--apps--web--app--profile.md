# apps/web/app/profile

Inventory: empty directory; no direct or nested files. No applicable ancestor AGENTS.md found. This is a promised missing route, not an evidenced intentional placeholder: `apps/web/SETUP_GUIDE.md:140–141` specifies a profile page, `utils/config.ts:43` exports `/profile`, and `middleware.ts:8` protects it. Authenticated visits currently lack a page handler. Navbar's authenticated branches (`components/Navbar.tsx:53,139`) expose Dashboard only; settings already contains profile editing (`app/settings/page.tsx:16–21,53`).

**P2 requirement gap / patch:** add `app/profile/page.tsx` with a default server component calling `redirect('/settings')`; document this canonical profile destination in SETUP_GUIDE. This restores the advertised URL without duplicating the existing editor.

Dependencies: existing settings route, Next.js redirect, authentication middleware; settings/API correctness belongs to adjacent reviews.

- [ ] Add the profile redirect and align documentation.
- [ ] Verify authenticated `/profile` reaches settings; anonymous `/profile` redirects to login with callback preserved.

Confidence: high from static inventory and integration evidence. No builds, runtime checks, or network used.
