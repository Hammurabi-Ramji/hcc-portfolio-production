# Folder review 096 — apps/web/app/settings

## Inventory and intended behavior

Reviewed every direct file: `page.tsx` (188 lines), the sole settings-route file. No applicable ancestor AGENTS.md was present. Integration reads covered AuthContext, UserService, User/Profile types, Navbar, useToast, root layout, API client, users route, package/TS configuration and dashboard settings link. Root README identifies the desktop stack; web README:85–95 specifies JWT sessions and users/profiles, and output/WEB_PLATFORM_SUMMARY.md:63–69 claims protected routes and global auth state. Generator docs/README.md identifies user-profile management; expanded/final reports make broad production claims but do not establish functioning Next.js settings persistence.

Current page provides five editable profile fields, saving/disabled state, Cancel, and account metadata. Needed behavior is an authenticated, prefilled editor that persists the current user's profile, updates shared state and displays success/failure.

## Findings and concrete patch targets

1. **P1 — Shared blockers prevent the route working.** `page.tsx:13` calls useAuth, but `app/layout.tsx:21–25` never mounts AuthProvider; AuthContext:162–164 throws without it. Additionally `services/user.service.ts:1` imports absent `./api`, while AuthContext:4 imports absent `api` from the types module. These are dependency findings, not settings-owned fixes. Mount a client provider wrapper in layout and normalize service/context imports to one correctly typed API client. UserService:41 targets PUT `/api/users/profile`; local users route only supplies collection GET/POST, with no profile route. Implement an authenticated persistence handler or explicitly configure a verified external backend contract before claiming save works.

2. **P1 — Initial empty values can overwrite the existing profile.** `page.tsx:16–22` captures user once; there is no synchronization when auth/profile arrives. Context starts with user=null (AuthContext:21), and refresh initialization does not hydrate it (33–39). The page also lacks an auth/loading gate (13–24,43). Once provider hydration is repaired, a direct visit still initializes blank fields and can submit them at line 29. Gate rendering/submission on completed authentication; initialize the editor after the resolved user/profile loads. Reset on identity changes and avoid overwriting dirty edits during unrelated refreshes. Enforce ownership server-side as well.

3. **P2 — Save feedback is invisible.** `page.tsx:14,32–37` invokes useToast but never renders its state. useToast.tsx:13,49–57 uses local state, and ToastContainer requires that exact state at lines 61–66. Destructure toasts/removeToast and render ToastContainer, or adopt an application-level toast provider. Verify both success and server-error messages are visible.

4. **P2 — Shared profile and signed-in navigation stay stale.** `page.tsx:31–32` ignores the returned profile; use updateUser with the validated returned profile or refreshUser after saving. `page.tsx:45` always passes null to Navbar, causing Login/Sign Up even for authenticated users (Navbar:53–93). Map User to Navbar's `{name, avatar}` shape. Dashboard:42 links `/dashboard/settings`, although this route is `/settings`; correct that caller or add an intentional redirect.

## Acceptance, dependencies, confidence

- [ ] Repair provider/client/profile-endpoint dependencies; pass web type-check/build.
- [ ] Direct authenticated visit hydrates all five fields; delayed auth cannot submit blanks; anonymous visit redirects after loading.
- [ ] Edited values persist across reload and update context; user switches do not leak prior form data.
- [ ] Successful/failed save shows visible feedback; saving state clears; navigation displays the signed-in user and reaches `/settings`.

High confidence from numbered source reads. No source changes, installs, network requests, builds or runtime tests performed. External backend availability and root verification results were not independently established.
