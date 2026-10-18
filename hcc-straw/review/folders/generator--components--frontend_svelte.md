# Folder review: components/frontend_svelte

**Scope and inventory.** Reviewed all direct content: `App.svelte` (23 lines). No direct manifest, entry point, or tests exist; no applicable ancestor AGENTS.md was found. Inspected controller copying/manifest creation, targeted generator requirements, desktop/web guides, and consuming package contracts. No source edits or execution checks were performed.

**Current versus specified.** This is a presentational shell with `saasName` and string-array `components` props, headings, a module list, and minimal styling. `docs/README.md:50` calls for core interactive Svelte UI; `docs/EXPANDED_SAAS_FRAMEWORK.md:9,35` allows customizable UI shells. That accurately describes the implementation. `docs/FINAL_VERIFICATION_REPORT.md:7,41` claims production completeness, which this component and its assembly contract do not demonstrate.

**Findings and patch targets.**

- **P2, proven misleading status:** `App.svelte:14` unconditionally marks every supplied module ONLINE. Selection does not establish runtime health; `core/controller.py:110-116` records selected components only. Replace the label with INCLUDED/SELECTED, or add an explicit status prop and render unknown/offline states until a real health result exists. No service request or health subscription exists in this component.
- **P2, integration requirement gap:** `App.svelte:2-3` defaults to a generic name and empty list. `core/controller.py:87-95,110-122` copies it into `src/frontend_svelte` and writes `saas_name`/`active_components`, but creates no mounting entry or prop mapping. No reference to this component/name was found in the inspected desktop/web source. Patch the generator scaffold or supply documented consumer wiring that maps both manifest fields. The desktop package supplies Svelte 5/SvelteKit/Vite; the web package supplies React/Next.js, so direct web reuse requires a defined adapter or separate implementation. A standalone package inside this reusable component is optional; an executable consumer contract is needed for generated-app claims.

**Dependencies and acceptance.** Depends on a Svelte compiler and a host supplying string component identifiers. Accept by mounting in a generated Svelte host, asserting the generated title and exact selected-module list, and ensuring selection alone never produces a healthy-service claim. Check empty selections and identifiers with multiple underscores; `replace('_', ' ')` at line 14 replaces only the first separator (minor display polish).

**Warranted tasks.**

- [ ] Correct unconditional ONLINE wording or introduce evidence-backed status data.
- [ ] Define and implement manifest-to-prop mounting in the generator/consumer boundary.
- [ ] Verify rendered generated-name/module behavior and align completeness documentation.

**Confidence.** High for direct-file behavior and observed copy-only assembly. Runtime compilation, generation, and browser checks were not run; no root test result is claimed here.
