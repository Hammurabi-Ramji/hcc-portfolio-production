# Folder review 141 — current WASM compute source

**Scope/inventory:** Reviewed every direct file: `straw-app/crates/wasm-frontend/src/lib.rs` (30 lines). No applicable ancestor `AGENTS.md` was present. Inspected adjacent manifests, current Svelte caller, Trunk entry/config, Tauri command, root/current README, and relevant generator/output documentation. No source changes or commands that build/test were run.

**Specified versus current:** Current `straw-app/README.md:29–39` specifies browser WebAssembly compute plus an optional native command. Both exports carry `#[wasm_bindgen]` (`lib.rs:3,15`). Fibonacci rejects inputs above 46 before performing at most 46 loop iterations (`:4–12`); greeting returns the documented string (`:16–17`). The former recursive/exponential-compute concern is fixed. The largest accepted result is 1,836,311,903; the final auxiliary value F(47) is also within `u32`. Therefore the fallback in `checked_add(...).unwrap_or(0)` is unreachable under the current guard and is not a demonstrated arithmetic defect.

**Findings:** No actionable source defect established. Existing unit coverage checks 0, 10, 46 and rejection at 47 (`:24–28`). Browser integration imports and initializes the generated module, validates integers/range and disables compute until initialization (`ui/App.svelte:3,29,55–59,98`). `index.html:7,19` targets this manifest and maps the generated module; `Trunk.toml:5` disables filename hashing. The native command delegates to the same function (`src-tauri/src/lib.rs:132–135`) and is registered (`:154`). Historical output guides describe the older implementation and do not establish current runtime verification.

**Patch targets/dependencies:** No implementation diff is warranted. If extending the accepted range later, revise the bound and checked-add behavior together. Integration depends on pinned wasm-bindgen 0.2.121/CLI, the WASM target, Trunk, local UI compilation, and Tauri packaging.

**Acceptance / remaining tasks:**

- [x] In the provisioned build environment, run the existing crate test and verify browser results at 0, 1, 10 and 46 plus invalid input rejection and module initialization failure handling.
- [x] Verify native `wasm_fibonacci` agrees with the browser result and rejects 47.

Verified by A-F038 — see `review/agent-output/A-F038.md`.

**Confidence:** High for static arithmetic/caller review; browser loading and native invocation remain unverified here. Saved core-test output compiled this crate but stopped at an unrelated Axum socket failure before its tests ran; the saved workspace test failed on lockfile resolution. Neither log proves this component's runtime acceptance.
