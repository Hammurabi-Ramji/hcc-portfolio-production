# Current folder review: straw-app/src-tauri/src (index 2)

Reviewed the **current replacement tree** on 2026-10-09. Direct inventory: `lib.rs` (183 lines) and `main.rs` (6 lines), both fully inspected with numbered lines. No applicable ancestor `AGENTS.md` was present. Historical reports about removed Rust modules and the former frontend are excluded.

## Existing behavior and requirements

`main.rs:1-5` configures the Windows subsystem and launches the library. `lib.rs:27-134,141-155` provides all 13 documented commands: flow identity/CRUD, workflow execution/history, database health, schemas, chat, generation/refinement/file saving, and optional native Fibonacci. Blocking database, model and filesystem work is dispatched through `spawn_blocking` (`lib.rs:19-24`). Setup opens the app-data SQLite database, binds the real Axum listener, and manages the shared database and service state (`lib.rs:156-168`). Exit sends a shutdown signal (`lib.rs:172-180`).

Integration inspection covered the adjacent manifests/configuration/capability, current README, engine flow/database/DAG/codegen boundaries, Axum implementation, and UI callers. Current camelCase payloads and command names agree; the UI obtains flow IDs from `flow_new`, saves before execution, and persists refinements before replacing displayed content. Axum receives the same cloned `DbState`; its actual bind address is 127.0.0.1:8741. These are implemented integrations, closing the former missing-managed-state/API/command-contract issues.

The current README describes a bounded desktop slice; legacy generator `docs/FINAL_VERIFICATION_REPORT.md:3-7,36-41` and `EXPANDED_SAAS_FRAMEWORK.md:35-40` readiness claims do not establish current verification. Old output engine guides describe different command names and localhost/model behavior and are historical references.

## Findings and patch targets

1. **P2 — A concurrent save can recreate a deleted flow.** `lib.rs:44-55` snapshots registry membership before dispatching persistence. `flow_delete` removes the registry entry and separately schedules deletion (`lib.rs:71-73`). For a current-session minted flow, a save can capture `known=true`, a later delete can finish, and the delayed save then unconditionally upserts the row. Engine `db.rs:53-63` confirms the upsert. This is reachable because sidebar deletion remains enabled while the editor is saving/running (`ui/App.svelte:47-53,75`; `FlowCanvas.svelte:43-56`). The save completion can also reinsert the row in the sidebar (`App.svelte:43-45`). This is a source-proven interleaving, not a reproduced runtime result. **Patch:** serialize per-flow save/delete operations across the authorization check and database mutation, preserving deletion invalidation; add matching UI coordination. A simple registry recheck before scheduling still leaves a race. Any engine transaction/helper belongs to its separately reviewed folder.

**Resolved during the audit:** the previously missing `STRAW-001-VERIFICATION.md` now exists and was reviewed by the package agent. Its current verification results and remaining gates replace the earlier missing-document finding.

## Dependencies, acceptance and limits

Dependencies: Tauri managed-state/runtime initialization, engine SQLite persistence and file guards, Axum/Tokio listener lifecycle, frontend IPC/global configuration, and Windows WebView2. Child implementation defects remain owned by their folder reports.

- [ ] Serialize lifecycle operations and use controlled barriers to verify a delayed save cannot recreate a flow after successful deletion.
- [ ] Verify real IPC new/save/list/delete/restart, foreign-ID rejection, execution failure/history, and refinement persistence in the desktop shell.
- [ ] Verify startup/bind-error reporting, API routes sharing the shell database, and listener shutdown; record results in the promised verification document.

Confidence is high for inventory/command contracts and the save/delete race, moderate for runtime lifecycle. No source changes, installs, network access, or tests were performed by this reviewer. Root's `desktop-current-cargo-test.log` reports a locked-workspace resolution failure; `desktop-current-core-tests.log:124-146` compiles the isolated core fixture but its real-server test fails with socket permission error 10013. Neither log validates Tauri startup, IPC, frontend, packaging, or installation; that failure alone does not prove an application networking defect.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
