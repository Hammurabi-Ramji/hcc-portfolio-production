# STRAW Stack root review — current tree

Reviewed 2026-10-09 by /root. Direct authored files before audit: README.md and .gitignore, both inspected. No applicable ancestor AGENTS.md was found; to-do.md did not previously exist. The workspace is a junction to the external checkout; canonical Git access was restricted, so no Git repair or index operation was performed.

## Existing versus specified

The root README names Svelte/Tauri/Rust/Axum/WASM but supplies no setup, application map, test strategy or release gates. apps/web is a separate Next.js scaffold. Desktop was replaced during this audit; the user explicitly selected the current Cargo/Trunk tree. Current README and STRAW-001-VERIFICATION.md now describe a bounded local desktop slice, while output guides retain older npm/multimodal/graph instructions. Original inventory/reports remain historical evidence; active tasks exclude removed source folders.

## Current findings and patch map

- P1: Web type-check still has 19 diagnostics and shared API/auth/provider wiring failures. Coordinate imports, response/wire types, real endpoints and authorization before describing protected features as working.
- P1: Current node input/branch contracts can truncate files or panic; fix validation and skip semantics before side effects. Current engine/Tauri/UI reports also identify partial generation and asynchronous lifecycle/state races.
- P2: Expand root README with desktop/web/generator ownership, package-local commands, supported features and dated validation. Link current desktop verification; label historical guides and incompatible demo formats.
- P2: Extend root artifact/cache/secret policy for the actual desktop and independent Node/Next packages. Do not remove authored requirements or untrack files without checking ownership.

## Verification and limits

Current source desktop cargo test --workspace --offline --locked passed 15 tests:12 engine,2Axum,1WASM. Initial lock/sandbox failures were resolved or isolated and are superseded by this successful check. An isolated clean native frontend build passed; all 150 saved browser files match clean output, no extras; the static import validator checks 107 modules. Browser/native UI interaction, live Ollama and installer execution remain unverified by this review. The current verification document reports its own build/installer-generation evidence and unresolved gates; those are distinguished from checks independently run here.

Generator 35 unit tests across 32 crates pass. CLI/isolated fixtures confirm non-generating help/list, option validation and deduplication, but reproduce misleading placeholder inclusion/readiness. All 18 saved bundles/236 component copies were compared:225 match,11 cosmetic Axum differences; no root application entrypoint. Current copy inventory covers 472 nested generated/copied folders, including generated browser runtime folders; upstream dependency trees are excluded from source-agent assignments.

## Tasks

- [ ] Repair current web build/API/session contracts and current destructive node behavior through their owning folders.
- [ ] Document desktop/web/generator boundaries, supported setup and current validation at the root.
- [ ] Reconcile historical guides/demo with the replacement and current release gates.
- [ ] Define artifact/cache/secret exclusions without treating authored documentation as disposable output.

No application source was patched by the review agent. Concurrent source changes are recorded in tree-transition.json; final coverage and local links are checked separately.
