# Folder review: components/support_portal_internal

Scope: all direct files inspected with numbered lines: `SupportPortal.svelte` (34 lines); no children, local manifest, or applicable ancestor AGENTS.md found. This is a reusable Svelte ticket-list shell. Generator registration exists at `core/config.json:45`; `core/controller.py:90-96` copies it into selected bundles. Targeted references inspected: root README, docs/README, expanded framework and final verification report, plus Stack desktop/web guide excerpts. No runtime caller was found in the generator frontend/template sources searched; copying alone does not mount a portal.

The expanded framework assigns Support Portal to education and creative-agency templates (`docs/EXPANDED_SAAS_FRAMEWORK.md:26,30`) and permits UI shells at line 35. A shell is therefore plausible, but the claim that all components are production-grade and placeholder-free (`docs/FINAL_VERIFICATION_REPORT.md:7`) exceeds this implementation.

## Findings and concrete patch targets

- **P2 — Resolution button has no functional effect.** `SupportPortal.svelte:4-6,20` only logs an ID; no state changes, callback, event, persistence, failure state, or status exists. Treat this as an unimplemented shell capability, not a verified backend defect. Patch the component to accept an asynchronous resolve callback, expose pending/error state, and update or refresh the parent-owned ticket list after success. Until wired, label this accurately as a preview or disable the action with explanation. Dependency: a documented ticket service and parent integration contract; none is supplied here.
- **P2 — Invalid CSS defeats vertical layout.** `SupportPortal.svelte:28` uses `flexDirection`, which is not the CSS property `flex-direction`. The flex container therefore retains its default row direction. Replace that declaration with `flex-direction: column` and verify several cards stack at narrow widths.
- **Proposed robustness improvement:** `SupportPortal.svelte:13` calls `ticket.priority.toLowerCase()` without a ticket schema. Valid string priorities work; missing/null priorities throw. Define required fields or normalize unknown priority to a neutral class. This is conditional, since no caller contract is present.

## Acceptance and tasks

- [ ] Correct the CSS declaration and inspect multi-ticket rendering.
- [ ] Define ticket fields and resolution callback/service ownership; test successful resolution, rejection, and duplicate clicks.
- [ ] Mount the portal in a selected generated Svelte host and verify the supplied ticket list and resolved state agree after refresh.
- [ ] Reconcile completion claims with the remaining UI-shell behavior.

Dependencies are the host Svelte compiler, parent-provided ticket data, and a future resolution service. This component alone supplies no application entrypoint or package dependencies. High confidence in the CSS and no-op action findings; integration confidence is limited to the targeted searched sources. Static inspection only: no builds, tests, installs, network calls, source edits, or broad copy comparisons performed.
