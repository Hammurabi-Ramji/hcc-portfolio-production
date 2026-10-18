# Folder review: apps/web/app/login (index 94)

## Inventory and specified behavior

Reviewed every line of the sole direct file, `page.tsx` (218 lines), plus targeted layout, auth context/service, middleware, package, types, and documentation integration. No applicable ancestor AGENTS.md was present. This client page supplies validated email/password inputs, password visibility, errors, remember-me, recovery/signup links, social buttons, and success navigation. `output/WEB_PLATFORM_SUMMARY.md:64,79` explicitly claims email/password and social authentication; web README:87-88 claims login and JWT sessions. Generator docs describe desktop-first Rust/JWT components, not an implemented backend for this Next page. Their production-ready assertions do not establish functioning web login.

## Findings and concrete patch targets

1. **P1 — Proven page dependency build blocker.** `page.tsx:8` imports `@hookform/resolvers/zod`, absent from `apps/web/package.json:12-24`. Saved root evidence `review/web-type-check.log:13` reports TS2307 for this exact import. Add a compatible resolver dependency to the web manifest and update its authoritative lockfile through the repository's package workflow. This needs coordination with signup, which uses the same import; no install was performed here.

2. **P2 — Proven request pending state is ineffective.** The submit button uses context `isLoading` (`page.tsx:23,153-156`), but `AuthContext.tsx:23-51` only changes it during initialization; login at `:53-81` never sets it. After initialization, repeated clicks/Enter can issue concurrent login requests and “Signing in...” never represents the request. Destructure `isSubmitting` from React Hook Form's `formState` at `page.tsx:30`; use `isLoading || isSubmitting` for disabled state and an appropriate pending label. Preserve `onSubmit`'s awaited promise so the form owns submission lifetime. Optionally prevent editing credentials during submission to avoid misleading response attribution.

3. **P2 — Proven return destination and persistence choice are discarded.** `middleware.ts:29-32` generates `callbackUrl`, but `page.tsx:41-43` always pushes `/dashboard`. Read and validate a same-origin local callback path, then `router.replace` that destination, falling back to dashboard; reject protocol-relative/external URLs. The checkbox is registered at `:135-140`, yet `:39` passes only email/password and context's login signature accepts only those arguments. Remove the choice until supported, or extend the chosen server-session contract to honor it; merely storing another browser flag does not implement session lifetime.

4. **P2 — Proven advertised actions are incomplete.** Google/GitHub buttons (`:171-203`) have neither handlers nor destinations. `/forgot-password` (`:142-147`) has no corresponding app directory in the inspected route inventory; local `app/api/auth` is empty, while service reset methods are only HTTP calls. Implement provider initiation/callback and password-recovery routes/backend flows, or remove these controls and revise the social-auth completion claim until they work. This is visible missing behavior, independent of the shared client failures.

The icon-only visibility button (`:115-125`) also lacks an accessible name. Add changing `aria-label`/`aria-pressed`; associate validation messages with inputs and mark the async error as an alert. These are concrete accessibility improvements, not runtime failures verified here.

## Dependencies and acceptance tasks

The already-recorded missing provider, nonexistent API import, envelope mismatch, absent endpoints, and cookie/localStorage disagreement remain prerequisites; see the context and lib folder reports. Repairing this page alone cannot produce a working session.

- [ ] Restore resolver dependency; rerun web type-check/build after coordinated shared fixes.
- [ ] With delayed success/failure, verify one request per submission, visible pending state, error recovery, and no premature redirect.
- [ ] Verify protected-route callback return, safe fallback for external callbacks, and explicit remember-me semantics.
- [ ] Exercise each retained social/recovery/signup action; keyboard/screen-reader checks cover toggle and errors.

High confidence in static findings. No source edits, installs, network, broad checks, runtime/browser tests, or builds were run; only the review report was written. Saved compiler evidence belongs to the root review.
