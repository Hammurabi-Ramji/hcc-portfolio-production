> This October 9 review records a removed Node.js, npm, Vite, and Playwright check. It is not the sovereign build. Eduba is the append-only SQLite archival ledger (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`). Current commands, from `straw-app/`: `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, Python, pip, Playwright, or Vite. `apps/web` is the quarantined legacy Next.js tree.

# STRAW application completeness review

Reviewed October 9, 2026. Scope: `C:\IEDB\STRAW Stack\straw-app`.

**Verdict: incomplete.** This folder contains a substantial desktop application prototype, but it does not currently qualify as a complete, verified STRAW application. The root README defines STRAW as **Svelte + Tauri + Rust + Axum + WASM**. Svelte, Tauri, and Rust are implemented; Axum is only a dependency; WASM exists and works separately but is not used by the active UI. Build failures and concrete integration defects also prevent a release-ready conclusion.

This review inspected the active entrypoints, commands, frontend components, persistence, graph execution, AI generation/chat, alternate workflow implementation, WASM package, and test/build configuration. Findings below distinguish direct command results from source analysis. Existing review reports were consulted as secondary context; the check/build/Cargo/WASM/discovery results below were independently obtained during this review.

## Validation performed

- **Frontend check failed:** `npm run check` reported **247 errors and 1 warning in 18 files**. Examples include JSX inside `src/no-code/health-check.ts`, missing React and related modules, broken alternate-frontend imports, and errors in the active `CodeGenPanel.svelte` component.
- **Production frontend build failed:** `npm run build` could not resolve the generated SvelteKit import of `shared-server.js`. This reproduced on a second run after type checking had finished. The workspace root is a Windows junction to `C:\IEDB\external\BSM-C\hcc-straw\hcc-straw`; generated relative imports mix these paths. This is a failure in this folder/setup, not proof that the same source could never build after configuration repair.
- **Rust validation blocked:** Cargo is installed under `C:\Users\hammu\.cargo\bin`, although it was absent from the clean shell PATH. Calling it explicitly with `check --locked --offline` stopped before compilation: the package believes it belongs to `C:\IEDB\Cargo.toml`, but is not a registered workspace member. Rust compilation/tests remain unverified.
- **WASM smoke check passed:** Node loaded the actual `wasm_compute_bg.wasm` through its generated JavaScript wrapper. `greet("review")` returned the expected greeting and `fibonacci(10)` returned `55`. This verifies those exports in isolation, not app integration.
- **Test discovery passed:** `npm run test:e2e -- --list` discovered **168 test cases in 9 files**, counting the Chromium/Firefox projects. No browser tests were executed. Discovery selected `playwright.config.ts`, which expects port **5173**, while Vite serves on **1422**. The alternate `.cjs` config targets a different test directory and the correct port.
- **Desktop startup, real IPC, live Ollama, installer creation/installation, and restart persistence were not exercised.** Historical build/test artifacts do not establish that the current sources pass.

## What is implemented

- **Svelte:** SvelteKit SPA with flow editing, chat, code generation, node configuration, and toast components. The active page imports Svelte components from `src/lib`.
- **Tauri:** Native launcher, application configuration, capabilities, and registered Rust commands with frontend `invoke` wrappers.
- **Rust:** Graph engine, **11 registered node types**, SQLite flow/execution persistence, HTTP/local-LLM calls, and generation/refinement functions. Presence is established; complete runtime correctness is not.
- **WASM:** Rust compute crate, generated JS/types, and an actual WASM binary. The frontend helper `src/lib/wasm.ts` is never imported by the active UI. Native `wasm_greet`/`wasm_fibonacci` commands call the Rust crate directly; that alone is not execution of WASM in the desktop frontend.
- **Axum:** `axum = "0.7"` is listed in Cargo.toml. There are no Axum routers, server startup calls, listeners, or routes in this app's Rust source. Tauri IPC provides the current frontend/backend connection. A missing Axum server does not prevent a Tauri-only app, but does leave the declared STRAW architecture incomplete.

## Findings that prevent a complete application

### 1. Build and workspace configuration fail

The commands above do not produce a verified frontend/native application. Fix the Cargo ownership boundary, junction/generated-path issue, and source/type errors before claiming successful packaging. Tauri's `beforeBuildCommand` is `npm run build`, so the observed frontend failure blocks the normal native packaging path too.

Sources: [Cargo manifest](</C:/IEDB/STRAW Stack/straw-app/src-tauri/Cargo.toml:1>), [Tauri build configuration](</C:/IEDB/STRAW Stack/straw-app/src-tauri/tauri.conf.json:5>), [alternate health-check source](</C:/IEDB/STRAW Stack/straw-app/src/no-code/health-check.ts:294>), [active code generator](</C:/IEDB/STRAW Stack/straw-app/src/lib/CodeGenPanel.svelte:30>).

### 2. Creating flows can overwrite an existing new flow

The page creates a flow with `id: ""`. FlowCanvas preserves that empty string with `record?.id ?? null`; Rust only allocates a UUID for `None`, so an empty ID is saved literally. SQLite's upsert then reuses that primary key. Subsequent new-flow actions also retain the same keyed editor identity, and saving does not refresh the parent's flow list. These are concrete source-level persistence/editor defects, not merely missing documentation.

Sources: [new-flow construction](</C:/IEDB/STRAW Stack/straw-app/src/routes/+page.svelte:33>), [editor ID](</C:/IEDB/STRAW Stack/straw-app/src/lib/FlowCanvas.svelte:23>), [save command](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/lib.rs:35>), [SQLite upsert](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/db.rs:65>).

### 3. Real frontend/backend data contracts do not match

Attachments use `mimeType`/`sizeBytes` in the frontend but `mime_type`/`size_bytes` in Rust, with no serialization adapter or serde aliases. The required `mime_type` prevents those attached requests from deserializing. Rust-generated CodeFile objects lack the `id` and `is_dirty` required by the UI, whose keyed rendering and edit/delete operations depend on identity. Mock responses supply IDs and therefore conceal this mismatch.

Sources: [frontend attachment/file types](</C:/IEDB/STRAW Stack/straw-app/src/lib/types.ts:79>), [raw IPC wrapper](</C:/IEDB/STRAW Stack/straw-app/src/lib/tauri.ts:28>), [Rust attachment](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/nlp.rs:6>), [Rust generated file](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/codegen.rs:8>).

### 4. Code generation does not reliably preserve named project files

`parse_code_blocks` treats closing fences as new file openers and invents names such as `newfile.rust` rather than preserving project paths. Multiple blocks of the same language reuse filenames, and `fs::write` overwrites previous content. Writes also lack checks that the model-derived path stays inside the selected output directory. Refinement receives no current file content and updates the UI without a command that saves the refined content to disk.

Sources: [file writer](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/codegen.rs:117>), [fence parser](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/codegen.rs:214>), [refinement](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/codegen.rs:266>), [UI refinement](</C:/IEDB/STRAW Stack/straw-app/src/lib/CodeGenPanel.svelte:104>).

### 5. Workflow execution can report misleading success

The active DAG engine returns a partial/empty topological order for cyclic or invalid graphs without rejecting them. Node failures are returned inside results while the UI reports a success toast. Execution persistence suppresses errors and records every saved run as `completed` with identical start/end timestamps. Reliable validation, failure propagation, and truthful execution history remain unfinished.

Sources: [graph execution](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/dag.rs:40>), [topological sort](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/dag.rs:82>), [success toast](</C:/IEDB/STRAW Stack/straw-app/src/lib/FlowCanvas.svelte:134>), [execution persistence](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/db.rs:102>).

### 6. Alternate workflow and multimodal features are unfinished

The React implementation in `src/no-code` is not mounted by the active Svelte route; it contains imports of nonexistent local subdirectories and dependencies absent from package.json. Its Rust `no_code/main.rs` is not included in the active module tree, so commands declared there are not the running application's workflow API. The registered `execute_workflow` and `initialize_db` require `DbState`, but the active Tauri builder never manages that state. Image attachments, even after fixing field names, contribute a textual description rather than image bytes to the actual LLM request.

Sources: [alternate app imports](</C:/IEDB/STRAW Stack/straw-app/src/no-code/App.tsx:3>), [active native entrypoint](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/lib.rs:101>), [module declarations](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/no_code/mod.rs:1>), [state-dependent command](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/no_code/workflow_executor.rs:541>), [image context](</C:/IEDB/STRAW Stack/straw-app/src-tauri/src/nlp.rs:60>).

### 7. Test and setup evidence is insufficient for completion

The default test configuration mixes mocked Svelte UI checks with API tests for external services on ports 3001–3005 and UI expectations for another dashboard. The desktop mocks replace backend execution and generation, including returning fields absent from real Rust responses. The README remains the starter-template text and does not document a reproducible Rust/WASM/Ollama build and test workflow.

Sources: [default test configuration](</C:/IEDB/STRAW Stack/straw-app/playwright.config.ts:18>), [API tests](</C:/IEDB/STRAW Stack/straw-app/tests/api.spec.ts:4>), [mock generated files](</C:/IEDB/STRAW Stack/straw-app/e2e/tauri-mock.js:57>), [app README](</C:/IEDB/STRAW Stack/straw-app/README.md:1>).

## Completion criteria

1. Establish reproducible package-local frontend and Rust builds, with the intended frontend implementation selected and checked.
2. Implement and wire the Axum and WASM responsibilities promised by STRAW, or explicitly revise the architecture claim.
3. Repair real IPC contracts, distinct flow IDs/editor refresh, graph validation, execution state/history, and generated/refined file persistence.
4. Run real desktop integration checks against SQLite and a supported local model, in addition to mocked UI tests.
5. Build and install a desktop package, verify startup and persistence after restart, and document prerequisites and supported commands.

**Classification:** substantial prototype / application under development. The evidence does not support calling this a complete STRAW-stack application.

Application source was not patched during this review. Validation commands may regenerate normal SvelteKit/build/test-report artifacts.
