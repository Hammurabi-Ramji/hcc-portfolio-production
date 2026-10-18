# Folder review: apps/web/hooks (index 100)

Scope: inspected all nine direct files with numbered lines: `useDebounce.ts`, `useLoading.ts`, `useLocalStorage.ts`, `usePermissions.tsx`, `useProtectedRoute.ts`, `useSessionStorage.ts`, `useTheme.ts`, `useToast.tsx`, and `useWindow.ts`. No applicable ancestor AGENTS.md was found. Checked AuthContext, UserRole, layout, project/settings callers, manifest, tsconfig, and targeted documentation. Source was not changed.

## Current versus specified

These client hooks provide storage, debounce, loading/async state, role checks, route gating, theme, notifications, and window utilities. `SETUP_GUIDE.md:23-32,326-330` advertises these capabilities; `output/CODEBASE_VERIFICATION_REPORT.md:62` calls the hooks complete, and `output/WEB_PLATFORM_SUMMARY.md:67,72` promises protected routes and theme readiness. Generator docs describe a separate desktop-first framework and do not specify this React hook API. Their completion claims do not establish browser correctness. Current permissions match `types/index.ts:14`; basic loading, value debounce, media-query, scroll, and outside-click cleanup have coherent implementations.

## Prioritized findings and concrete patch targets

1. **P1, proven build failure:** `useTheme.ts:7` calls unimported `useState`; line 4 imports only `useEffect`. Add `useState` to the React import and remove unused pathname import/state. The existing controller `review/web-type-check.log` confirms TS2304 here; all TS files are included by `tsconfig.json:25`, even unused hooks.
2. **P1, latent authorization failure:** `useProtectedRoute.ts:18-22` sets authorization true during auth loading and never resets it when authentication becomes false. Return `!isLoading && isAuthenticated` directly and redirect with `replace` only after loading resolves unauthenticated. No source caller currently imports this hook, so this is an exported-API defect, not evidence that it gates current pages. AuthProvider wiring and session restoration are separate context dependencies.
3. **P2, broken callback debounce:** `useDebounce.ts:31-43` stores a timer in state but omits it from callback dependencies; the retained callback sees its initial null timer, allowing every queued invocation to execute. Replace timer state with a ref, clear before scheduling, and cancel on unmount/delay change; keep the latest callback through a ref or correctly managed dependencies. Ordinary value debounce at lines 10-23 already cancels correctly.
4. **P2, storage state errors:** Both setters evaluate functional updates against closed-over `storedValue` (`useLocalStorage.ts:37`, `useSessionStorage.ts:28`), so two increments in one batch lose an update. Use a current-value ref synchronized with state to compute and persist each update. Local storage ignores key changes (`57-59`); session storage retains the previous key's value when the new key is absent (`17-20`) and removal never resets state (`39-43`). Reload/reset on key changes and reset on removal. Local storage's browser-dependent initial read (`18-32`) can also produce mismatched server/client first renders; initialize deterministically and hydrate in an effect.
5. **P2, notifications invisible/overlapping:** Project/settings callers invoke this per-instance hook but discard `toasts/removeToast`; no source mounts `ToastContainer`. Supply a shared provider/container or explicitly render each caller's state. In `useToast.tsx:69,80-84`, every toast is independently fixed at the same coordinates, defeating stacking. Position the parent only, add an accessible dismiss label at line 89, and track/cancel timeout handles on removal/unmount (`22-24`). Coordinate caller/layout edits with their owners.

## Dependencies and acceptance

Dependencies are React 19, Next 15 navigation, browser storage/media APIs, and a functioning AuthProvider. `usePermissions.tsx` has unused derived state/imports; removing these is cleanup, not a permission-policy defect. `useLoading.ts:26-46` allows overlapping executions to clear loading prematurely and stale results to win: define latest-request or concurrent-request semantics before adoption. `useWindowSize:11-14` should use a deterministic initial size if rendered into SSR-visible output. Neither utility currently has a source caller.

- [ ] Fix theme import; controller reruns web type-check after coordinated repairs.
- [ ] Verify loading/authenticated/logged-out transitions never authorize early.
- [ ] Fake-timer check: rapid callback calls execute once with latest arguments; unmount cancels.
- [ ] Verify batched storage increments, key switching, absent/corrupt values, removal, and hydration.
- [ ] Verify project/settings success/error messages appear, stack, dismiss accessibly, and expire.

Confidence: high for static findings and controller-confirmed compiler error. No installs, network, broad tests, browser checks, or new test runs performed; root owns verification. Async/SSR utility concerns are adoption requirements rather than proven current-page regressions.
