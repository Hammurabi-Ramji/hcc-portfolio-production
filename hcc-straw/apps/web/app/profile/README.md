# `/profile`

Advertised URL for the signed-in profile surface. Editing UI lives at `/settings`; this route is a server redirect so the advertised path stays valid without duplicating the editor.

## Behavior

| Visitor | Result |
| --- | --- |
| Anonymous `GET /profile` | Middleware redirects to `/login?callbackUrl=/profile` (session cookie `straw_session` absent). |
| Authenticated `GET /profile` | This page calls `redirect('/settings')`. |

Protected-route membership for `/profile` is owned by `apps/web/middleware.ts`. Config export `ROUTES.profile` (`utils/config.ts`) remains `/profile`.

## Documentation note

`SETUP_GUIDE.md` still labels `app/profile/page.tsx` as “Profile page”. Within this owned folder, the canonical destination is explicitly `/settings` via redirect. Tree-wide SETUP_GUIDE wording is outside this folder’s edit lease.
