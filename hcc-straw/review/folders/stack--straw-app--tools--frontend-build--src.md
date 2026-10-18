# Folder review: straw-app/tools/frontend-build/src (146)

## Inventory and behavior

Reviewed the only direct file, `main.rs` (140 lines), plus the adjacent Cargo manifest, workspace/lock metadata, Trunk hook, import map, UI entry and imports, runtime NOTICE, current application README, relevant Stack output guides, and generator requirements excerpts. No applicable ancestor AGENTS.md was present. Snapshot: 2026-10-09; main.rs SHA256 `876D22C9365B30ACCEB00DA9BD094FEF9BEBED46712330B966AC29707421281D`.

The helper compiles every direct `ui/*.svelte` file using native `rsvelte_core`, requests client/runes mode and injected CSS, rewrites component imports, copies the local runtime/clsx, creates esm-env flags, and parses the reachable static module graph with OXC. The Trunk pre-build hook runs this package offline. Current imports (main.rs:1-4) match manifest dependencies, including pinned rsvelte revision and OXC 0.149.0; Cargo.lock now contains those dependencies. The earlier QuickJS-versus-manifest defect is **superseded**, not a current finding. Six generated component files exist, but their timestamps precede this source snapshot and do not verify this exact revision.

## Findings and patch targets

**P2 — stale generated components can conceal broken source imports.** `main.rs:34-35` creates/reuses `public/ui`, and `main.rs:36-67` overwrites only components still present in `ui`. Nothing removes old component files; `copy_tree` likewise overlays the vendor tree (lines 8-19, 69-72). After a successful build, delete/rename a source component but leave its former import in another source file: the compiled import still finds the old generated `.js` at validation (lines 100-106), allowing an incremental build to pass while a clean checkout fails. Trunk copies the stale output directory into the distribution. This is a deterministic source-level regression scenario, not an observed failing build.

Concrete patch: have `build` generate into a fresh, build-owned staging directory; validate against that directory using the same URL mapping; replace `public/ui` only after validation succeeds. Alternatively remove the explicitly build-owned output before generation, accepting that failures then leave partial output. Do not delete arbitrary directories. Add a narrow deletion/rename regression fixture to prove stale output cannot satisfy an import.

**Validation limit, not a demonstrated current defect:** lines 108-132 parse syntax and resolve static requested modules; they do not verify imported export names or execute runtime behavior. Current UI uses static imports. Treat the success message as graph/syntax validation only. Optional follow-up: reject or validate dynamic imports if introduced and add a browser smoke check for exported Svelte helpers and WASM initialization. The unscoped string replacements at lines 62-63 should eventually target import specifiers, to avoid changing future user strings ending in `.svelte`.

## Dependencies, acceptance, and confidence

Requires provisioned pinned Rust compiler/OXC sources, matching vendored Svelte 5.57.1 runtime, clsx 2.1.1, Trunk, wasm-bindgen, and browser import-map support. `third-party/NOTICE.md` explicitly distinguishes browser JavaScript from the native compiler. Legacy production-ready reports do not validate this rewritten pipeline.

- [ ] Generate outputs in a fresh owned directory; delete a component without fixing its importer and require failure on both clean and incremental builds.
- [ ] Root reruns locked/offline package and Trunk builds against the final snapshot, then opens the browser/desktop UI and runs WASM compute.
- [ ] Confirm missing vendor modules and unmapped imports fail with the originating path; retain compiler/runtime version alignment.

Read-only review; no source changes, installs, network, or build commands executed. Root log `review/desktop-current-cargo-test.log` stopped at lock update refusal; the lockfile changed later, so that log establishes neither failure nor success of current source. High confidence in dependency alignment and stale-output mechanism; compiler/API/runtime execution remains unverified. Concurrent edits may supersede this snapshot.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
