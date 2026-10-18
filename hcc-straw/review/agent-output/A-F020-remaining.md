# A-F020-remaining — apps/web/hooks

Status: **DONE** for the two unchecked folder-review acceptance items. No further `apps/web/hooks/**` source edits were required; prior A-F020 repairs already satisfy both gates. This pass re-verified them and recorded fresh evidence.

## Unchecked items closed

1. **Fix theme import; controller reruns web type-check after coordinated repairs.**
   - `apps/web/hooks/useTheme.ts` imports `{ useEffect, useState }` from `react`; unused `usePathname` is absent.
   - Focused strict TypeScript over hook modules: exit **0** (`A-F020-remaining/logs/hook-type-check.log`).
   - Whole-web `tsc --noEmit --project apps/web/tsconfig.json`: exit **2** (`A-F020-remaining/logs/web-type-check.log`), with **zero** diagnostics under `hooks/`, `useTheme`, or `useToast` (`A-F020-remaining/logs/web-hooks-diagnostics.log`). Remaining failures are outside hooks ownership (controller/A-S03/A-F003).

2. **Verify project/settings success/error messages appear, stack, dismiss accessibly, and expire.**
   - Layout already mounts `ToastProvider` from `@/hooks/useToast` around page children (`apps/web/app/layout.tsx`).
   - Projects/settings callers use `useToast().success` / `error` with the strings exercised below.
   - Offline React/browser harness with exact consumer strings: exit **0** (`A-F020-remaining/logs/project-settings-toasts.log`, `A-F020-remaining/project-settings-toast-results.json`).
   - Covered: shared provider store across two consumers, all seven project/settings messages visible, parent-only fixed stacking (≥8px gap), success=`status` / error=`alert`, native dismiss buttons with accessible names, manual dismiss, 3000ms expiry, provider unmount timer cleanup.
   - Regression suite also re-run: `node review/agent-output/A-F020/run-tests.cjs` exit **0** (nine groups including toast stack/dismiss/expiry and theme import/hydration/toggle).

## Files changed

- `apps/web/hooks/**`: **none** this pass (already repaired).
- Evidence/harness only under `review/agent-output/A-F020-remaining*` (not application source).

## Verification summary

| Check | Command / artifact | Exit |
| --- | --- | --- |
| Theme import static | `useTheme.ts` has `useState`; no `usePathname` (`logs/theme-static.log`) | n/a (pass) |
| Focused hooks type-check | `tsc` on hook modules (`logs/hook-type-check.log`) | **0** |
| Whole-web type-check (diagnostic) | `tsc --project apps/web/tsconfig.json` (`logs/web-type-check.log`) | **2** (no hooks hits) |
| Hook browser regression | `node review/agent-output/A-F020/run-tests.cjs` | **0** |
| Project/settings toast gate | `node review/agent-output/A-F020-remaining/run-project-settings-toasts.cjs` | **0** |

## Blockers

- **None** for hooks-owned remaining acceptance.
- Whole-application type-check remains failed for non-hook modules; deferred to controller / A-S03 / A-F003. Not a hooks defect.
- Live HTTP project/settings request paths are not re-driven here; delivery is verified via the mounted provider contract and exact page message strings in a real React DOM, matching the folder-review toast acceptance that A-F020 deferred to integration.

## Settlement

`A-F020-remaining | DONE | theme import confirmed (focused tsc 0; web tsc has no hooks diagnostics); project/settings success/error toast appear/stack/dismiss/expire verified exit 0 | review/agent-output/A-F020-remaining.md`
