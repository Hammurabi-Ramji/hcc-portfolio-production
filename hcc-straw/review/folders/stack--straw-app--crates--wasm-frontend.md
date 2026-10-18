# Folder review 140 — WASM compute package integration

**Inventory and scope:** The only direct file is `straw-app/crates/wasm-frontend/Cargo.toml` (11 lines), read completely with numbered lines. No applicable ancestor `AGENTS.md` was present. Source belongs to review 141; this review checks its package boundary and integration. Relevant current README, generator documentation, historical output guides, workspace/lockfile, Trunk entry/config, UI caller, and native dependency were inspected. No source edits, installs, network access, or tests were performed.

**Specified versus current:** Current README `:29–39` requires browser compute plus an optional native command. Manifest `:7` supplies both `cdylib` for WASM binding generation and `rlib` for Rust callers. Its sole dependency pins wasm-bindgen exactly to 0.2.121 (`:10`), matching `Cargo.lock:4811–4812` and the documented CLI prerequisite (`README.md:11`). Root `Cargo.toml:3–4` includes this crate in workspace and default members. Tauri depends on its local path (`src-tauri/Cargo.toml:21`) and delegates the registered command to the shared function (`src-tauri/src/lib.rs:133–134,154`).

**Findings and patch disposition:** No actionable manifest defect established. Trunk explicitly selects this manifest (`index.html:7`), suppresses automatic module import, and the import map resolves the generated module (`:19`). `Trunk.toml:5` disables hashing, keeping that module URL stable; `:13` watches this crate. UI explicitly initializes its imported module (`ui/App.svelte:3,29`) before allowing compute and validates the supported input range. The bounded arithmetic finding is covered by source review 141; it does not warrant a dependency or manifest patch. Historical production-readiness claims in generator/output documentation do not prove this current package's browser acceptance.

**Dependencies and evidence:** Rust WASM target, Trunk, matching wasm-bindgen CLI, local Svelte build hook/runtime, and Tauri packaging remain integration dependencies. Root's saved `review/desktop-current-full-tests.log:46–51` records `tests::bounded_compute` passing, superseding the older failed-test evidence cited in source review 141. That native unit result does not establish generated browser asset loading or live desktop invocation.

**Acceptance / remaining tasks:**

- [ ] In the provisioned build environment, verify Trunk emits the module URL referenced by the import map and the browser initializes it successfully.
- [ ] Exercise browser compute boundaries 0 and 46, rejection of invalid values, and native command agreement; verify initialization failure feedback.

**Confidence:** High for package and static integration consistency; no implementation diff proposed. Browser execution and desktop invocation were not run by this reviewer.
