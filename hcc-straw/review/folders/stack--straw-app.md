# Folder review: straw-app (105)

Scope: direct package files in `C:\IEDB\STRAW Stack\straw-app`, refreshed 2026-10-09 after the concurrent compiler migration. No applicable ancestor AGENTS.md was found. Source was not changed by this reviewer.

## Inventory and current versus specified behavior

Inspected every current direct file with numbered lines: `.gitignore` (10), `Cargo.toml` (18), `index.html` (28), `README.md` (67), `STRAW-001-VERIFICATION.md` (55), and `Trunk.toml` (20). `Cargo.lock` was selectively inspected for workspace package identities, compiler/OXC/serde_json dependencies, native compiler Git revision, and wasm-bindgen pin.

The current package implements the desktop-first STRAW direction described in generator `docs/README.md:3`: Svelte 5, Tauri 2, Rust, SQLite, loopback Axum/Ollama, and browser WASM. The direct Cargo workspace establishes an independent boundary (`Cargo.toml:1-4`); Trunk binds 127.0.0.1:8080 and calls the offline Rust frontend hook (`Trunk.toml:7-19`). Tauri's adjacent configuration uses that same dev URL and dist directory. The import map now includes `#client/constants` (`index.html:16`) and a stable compute-module path, consistent with `filehash = false` (`Trunk.toml:5`). Ignore rules cover generated output, SQLite files, and .env.

README:29 now accurately describes native rsvelte_core 0.12.6, its pinned revision, and the Svelte 5.57.1 browser runtime. The compiler's source, manifest, and owned lock entry (`Cargo.lock:1083-1091`) agree on rsvelte_core/OXC/serde_json. The earlier undeclared QuickJS dependencies are **resolved**, not a current blocker. The formerly missing verification link at README:64 is also **resolved**: its target now exists and was reviewed. Registry entries 134–147 cover the new source trees; there is no outstanding assignment task here.

## Current findings and patch targets

**P2 — incremental generated assets can conceal removed source components (child integration finding).** Trunk copies `public` into the distribution (`index.html:8`) after its mandatory hook (`Trunk.toml:16-19`). The compiler currently overlays `public/ui` (`tools/frontend-build/src/main.rs:34-67`) and vendor assets rather than replacing the generated tree. A removed or renamed source component can leave its former JavaScript output available to satisfy an unchanged import, allowing incremental validation to pass while clean validation fails. This deterministic mechanism is documented by the dedicated child review `review/folders/stack--straw-app--tools--frontend-build--src.md`; no regression experiment was run here. Patch that child helper to generate and validate in a fresh build-owned staging directory, then replace its output. Acceptance: delete a component while retaining its importer and require both clean and incremental builds to fail.

**P2 — documentation/evidence alignment remains necessary.** Stack output guides still prescribe npm commands (`output/QUICK_REFERENCE.md:23,251`, `output/FINAL_STATUS.md:83,230`), whereas this package has no package.json. Update those files through their owner to the current Cargo/Trunk workflow. Keep the verification report's explicit G3 failure and live-execution limits (`STRAW-001-VERIFICATION.md:29,32,43-45`); do not convert the broader legacy completion claims into current release certification.

## Evidence, dependencies, and acceptance

The controller's `review/desktop-current-full-tests.log` confirms `cargo test --workspace --offline --locked` passed: 12 engine, 2 Axum, 1 native compute test; compiler and Tauri targets built with zero tests. This supersedes earlier workspace-boundary, Svelte-check, and Playwright-discovery logs for the current architecture. The new application verification document claims Trunk and native installer-generation success at lines 20–21; this reviewer did not independently run those commands or inspect their command logs. Native tests do not execute browser WASM or prove installer behavior.

- [x] Fix and regression-check stale generated component/vendor output through the compiler child owner.
- [x] Align legacy output run instructions with the current package.
- [x] Retain final-snapshot clean Trunk/native packaging evidence, including import-map assets and compiler/runtime alignment.
- [ ] Observe browser/Tauri UI, WASM button, IPC/persistence, and local model inference; execute and verify installers with documented prerequisites.
- [x] Resolve or explicitly track the documented G3 source-scan failure before advancing its gated slice.

Confidence is high for direct inventory, resolved dependency alignment, and the current test-log results. Browser execution, native package behavior, installation, model inference, and complete child implementation correctness remain outside this read-only review. No builds, installs, tests, or network calls were performed by this reviewer.

## A-F029 follow-up (2026-10-18)

Root owner evidence: `review/agent-output/A-F029.md`. Stale-output regression is settled via A-F050. Legacy run instructions redirected from this package README/`scripts/` to Cargo/Trunk (stack `output/` remains archival). Packaging snapshot + retained clean Trunk logs recorded under `review/agent-output/A-F029/`. G3 disposition tracked with release hold open (`A-F029/G3-DISPOSITION.md`). Live UI/installer observation checkbox remains open (`A-F029/LIVE-OBSERVATION.md`).
